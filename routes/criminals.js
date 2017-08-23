'use strict';

// Require statements
var router = require('express').Router();
const Criminal = require('../models/Criminal');
const config = require('../config');
const url = require('url');
const querystring = require('querystring');
const sqvt = require('../lib/search-query-vuetable');
const multer = require('multer');
const path = require('path');
const uuidv4 = require('uuid/v4');
const mime = require('mime-types');
const streamifier = require('streamifier');

// Multer configurations
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.png' && ext !== '.jpeg' && ext !== '.JPG' && ext !== '.PNG' && ext !== '.JPEGS') {
            return callback(new Error('Only jpg, png, jpeg are allowed'), false);
        }

        callback(null, true);
    },
    limits: {
        fileSize: 1024 * 4096, // 1024bytes * 4096 max size of 4MB
    }
});

// Chain GET & POST api /api/criminals
router.route('/')
    .get((req, res, next) => {
        // Declarations
        var criminalCollectionCount = null;
        var error;
        var errMsg = '';

        // Collect pagination query parameters
        var sortQuery = req.query.sort;
        var pageNumberQuery = parseInt(req.query.page);
        var numberPerPageQuery = parseInt(req.query.per_page);

        // Validate values of query parameters
        if (isNaN(pageNumberQuery) || isNaN(numberPerPageQuery) || pageNumberQuery < 1 || numberPerPageQuery < 1) {
            return res.status(400).json({
                message: 'Error, invalid query parameters!'
            });
        }

        // Calculate offset for pagination
        var offsetForDb = numberPerPageQuery * (pageNumberQuery - 1);

        // Get offence records from database with pagination
        Criminal.count({})
            .then((count) => {
                console.log(`COUNT: ${count}`);
                // Assign count to variable
                criminalCollectionCount = count;

                return Criminal.find().skip(offsetForDb)
                    .limit(numberPerPageQuery)
                    .exec();
            })
            .then((instances) => {
                console.log(`INSTANCES: ${instances}`);
                // Create response objects for return
                var respObj = new Object();
                var respDataArr = new Array();
                var previousPageUrl;
                var nextPageUrl;
                var totalCount = criminalCollectionCount;
                var lastPageValue = Math.ceil(totalCount / numberPerPageQuery);

                console.log(pageNumberQuery, lastPageValue);

                if (pageNumberQuery > lastPageValue) {
                    errMsg = `There are no more items for page number ${pageNumberQuery}`;
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Prepare nextPageUrl and previousPageUrl for return in response
                var requestUrl = url.parse(req.originalUrl);
                if (pageNumberQuery === 1) {
                    previousPageUrl = null;
                } else {
                    requestUrl.search = querystring.stringify(sqvt.generateSearchQuery(null, pageNumberQuery - 1, numberPerPageQuery));
                    previousPageUrl = url.format(requestUrl);
                }

                if (pageNumberQuery >= lastPageValue) {
                    nextPageUrl = null;
                } else {
                    requestUrl.search = querystring.stringify(sqvt.generateSearchQuery(null, pageNumberQuery + 1, numberPerPageQuery));
                    nextPageUrl = url.format(requestUrl);
                }

                // Prepare response object with data
                respObj.total = totalCount;
                respObj.per_page = numberPerPageQuery;
                respObj.current_page = pageNumberQuery;
                respObj.last_page = lastPageValue;
                respObj.next_page_url = nextPageUrl;
                respObj.prev_page_url = previousPageUrl;
                respObj.from = (((pageNumberQuery - 1) * numberPerPageQuery) + 1);
                if ((pageNumberQuery === lastPageValue) && (totalCount < (numberPerPageQuery * lastPageValue))) {
                    respObj.to = totalCount;
                } else {
                    respObj.to = pageNumberQuery * numberPerPageQuery;
                }
                respObj.data = instances;

                // Return data to client
                res.json(respObj);
            })
            .catch((err) => {
                // Log error
                console.log(`Get criminals by pagination error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred while trying to retrieve criminal records.`
                    });
                }
            });
    })
    .post(upload.single('criminalImage'), (req, res, next) => {
        // Declarations
        const faceApi = req.app.get('faceApi');
        const blobStorage = req.app.get('blobStorage');
        var temp = null;
        var tempDbId = null;

        // Get personGroupInfo for criminals
        const criminalPersonGroup = config.cognitiveService.personGroups.filter((group) => {
            return group.personGroupId === 'criminals';
        })[0];

        // Construct personGroupOptions
        const personGroupOptions = {
            name: criminalPersonGroup.personGroupName,
            userData: criminalPersonGroup.personGroupDescription
        };

        // Get containerName for criminals on blob storage
        const criminalContainer = config.azureBlob.containers.filter((container) => {
            return container.name === 'criminalimages';
        })[0];

        // Collect user inputs
        const name = req.body.name;
        const description = req.body.description;

        // Image input configurations
        const imageBuffer = Buffer.from(req.file.buffer);
        const fileExt = mime.extension(req.file.mimetype);
        const imageName = `${uuidv4()}.${fileExt}`;
        const imageSize = req.file.size;
        var stream = streamifier.createReadStream(imageBuffer);

        // Construct userInformation for createFullPerson
        const userInformation = {
            name: name,
            userData: new Date().toISOString()
        }

        // Run cognitive services operations
        faceApi.createPersonGroupIfNotExist(criminalPersonGroup.personGroupId, personGroupOptions)
            .then((success) => {
                // Create criminal with cognitive service
                return faceApi.createFullPerson(imageBuffer, userInformation, criminalPersonGroup.personGroupId);
            })
            .then((respObject) => {
                // Assign respObject to temp
                temp = respObject;

                // Logging
                console.log(`Criminal is successfully created on cogntiive services.`);
                // throw new Error('random');

                // Add image to blob storage
                return blobStorage.uploadImage(criminalContainer.name, imageName, stream, imageSize);
                //res.json(respObject);
            })
            .then((result) => {
                // Logging
                console.log(result);
                // throw new Error('random');

                console.log(temp);
                // Construct criminal schema to store to database
                return Criminal.create({
                    name: name,
                    description: description,
                    imageName: imageName,
                    csPersonId: temp.personId,
                    faceId: [temp.persistedFaceId]
                });
            })
            .then((instance) => {
                // Assign object id of committed db instance
                tempDbId = instance._id;

                // Log success
                console.log('DB completed');
                // throw new Error('testing error');

                // Train personGroup
                faceApi.trainPersonGroup(criminalPersonGroup.personGroupId);

                return res.json({
                    message: 'Criminal record is successfully created!'
                });
            })
            .catch((err) => {
                // Log error
                console.log(`Create criminal record error: ${err}`);

                // Wipe cogntive service person if exists
                if (temp !== null) {
                    // Logging
                    console.log(`Undoing commits to cognitive service person.`);
                    faceApi.deletePerson(criminalPersonGroup.personGroupId, temp.personId);
                }

                // Delete image from blob storage if exists
                blobStorage.deleteBlobIfExists(criminalContainer.name, imageName);

                // Delete from MongoDb if instance exists
                if (tempDbId !== null) {
                    // Logging
                    console.log(`Deleting criminal db record with id: ${tempDbId}`);

                    // Remove criminal record from database
                    Criminal.findByIdAndRemove(tempDbId)
                        .then((result) => {
                            // Log success
                            console.log(`Successfully deleted criminal record due to failed creation: ${result}`);
                        })
                        .catch((err) => {
                            // Log error
                            console.log(`Delete criminal record due to failed creation error: ${err}`);
                        });
                }

                // Return error to client
                return res.status(500).json({
                    message: `An unexpected error occurred while trying to create criminal record!`
                });
            });
    });

// Chain GET(id), PUT & DELETE api /api/criminals/criminalId
router.route('/:criminalId')
    .get((req, res, next) => {
        // Declarations
        var error;
        var errMsg = '';

        // Obtain criminalId from query params
        const criminalId = req.params.criminalId;

        // Find criminal by id from db
        Criminal.findById(criminalId)
            .then((instance) => {
                // Check if any item is found
                if (instance === null) {
                    // Construct and throw error if no item is found from database
                    errMsg = 'Error, requested criminal record does not exist!';
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }
                // Logging
                console.log(`Successfully retrieived criminal instance from database.`);

                // Return instance to client
                res.json(instance);
            })
            .catch((err) => {
                // Log error
                console.log(`Get criminal record by id error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred while trying to fetch criminal record!`
                    });
                }
            });
    })
    .put(upload.any(), (req, res, next) => {
        // Declarations
        var error;
        var errMsg = '';
        var temp = new Object();
        var tempInstance = null;
        const faceApi = req.app.get('faceApi');
        const blobStorage = req.app.get('blobStorage');

        // Get personGroupInfo for criminals
        const criminalPersonGroup = config.cognitiveService.personGroups.filter((group) => {
            return group.personGroupId === 'criminals';
        })[0];

        // Get containerName for criminals on blob storage
        const criminalContainer = config.azureBlob.containers.filter((container) => {
            return container.name === 'criminalimages';
        })[0];

        // Obtain criminalId from query params
        const criminalId = req.params.criminalId;

        // Collect user inputs
        const name = req.body.name;
        const description = req.body.description;

        if (req.files.length === 1) {
            // Logging
            console.log(`Updating criminal with image.`);

            // Image input configurations
            const imageBuffer = Buffer.from(req.files[0].buffer);
            const fileExt = mime.extension(req.files[0].mimetype);
            const imageName = `${uuidv4()}.${fileExt}`;
            const imageSize = req.files[0].size;
            var stream = streamifier.createReadStream(imageBuffer);

            // Find criminal from database
            Criminal.findById(criminalId)
                .then((instance) => {
                    // Check if criminal record exists
                    if (instance === null) {
                        errMsg = 'Criminal record does not exist for updating!';
                        error = new Error(errMsg);
                        error.status = 404;
                        throw error;
                    }

                    // Assign instance to tempInstance
                    tempInstance = instance;

                    // Construct userInformation for createFullPerson
                    const userInformation = {
                        name: instance.name,
                        userData: new Date().toISOString()
                    }

                    // Update cognitive service person
                    return faceApi.updatePersonWithSingle(imageBuffer, userInformation, criminalPersonGroup.personGroupId, instance.csPersonId, instance.faceId[0]);
                })
                .then((respObject) => {
                    // Object to store changes
                    temp.persistedFaceId = respObject.persistedFaceId;

                    // Logging
                    console.log(`Successfully updated face on cognitive services.`);

                    // Upload image to blob storage
                    return blobStorage.uploadImage(criminalContainer.name, imageName, stream, imageSize);
                })
                .then((result) => {
                    // Logging
                    console.log(`Successfully uploaded updated criminal image on azure blob.`);

                    // Remove old image from blob storage
                    return blobStorage.deleteBlobIfExists(criminalContainer.name, tempInstance.imageName);
                })
                .then((result) => {
                    // Logging
                    console.log(`Successfully removed old criminal image from blob storage`);

                    // Update criminal record from database
                    return Criminal.findByIdAndUpdate(criminalId, {
                        name: name,
                        description: description,
                        imageName: imageName,
                        faceId: [temp.persistedFaceId]
                    });
                })
                .then((updatedInstance) => {
                    // Logging
                    console.log(`Successfully updated criminal record with image`);

                    // Return success to client
                    res.json({
                        message: 'Successfully updated criminal record with image!'
                    });

                    // Train personGroup
                    faceApi.trainPersonGroup(criminalPersonGroup.personGroupId);
                })
                .catch((err) => {
                    // Log error
                    console.log(`Update criminal record error: ${err}`);

                    // Return error to client
                    if (errMsg !== '') {
                        return res.status(err.status).json({
                            message: err.message
                        });
                    } else {
                        return res.status(500).json({
                            message: 'An unexpected error occurred while trying to update the criminal record.'
                        })
                    }
                });

        } else if (req.files.length <= 0) {
            // Logging
            console.log(`Updating criminal without image.`);

            // Update criminal document from database
            Criminal.findByIdAndUpdate(criminalId, {
                    name: name,
                    description: description
                })
                .then((updatedInstance) => {
                    // Check if criminal record exists
                    if (updatedInstance === null) {
                        errMsg = 'Criminal record does not exist for updating!';
                        error = new Error(errMsg);
                        error.status = 404;
                        throw error;
                    }
                    // Logging
                    console.log(`Successfully updated criminal record without updating image.`);

                    // Return success to client
                    res.json({
                        message: 'Criminal record is successfully updated!'
                    });
                })
                .catch((err) => {
                    // Log error
                    console.log(`Update criminal record without image error: ${err}`);

                    // Return error to client
                    if (errMsg !== '') {
                        return res.status(err.status).json({
                            message: err.message
                        });
                    } else {
                        return res.status(500).json({
                            message: 'An unexpected error occurred while trying to update the criminal record.'
                        });
                    }
                });
        } else {
            // Logging
            console.log(`More than one file is being sent, reject upload`);

            // Return error to client
            return res.status(400).json({
                message: 'Failed to update criminal record, only 1 image is allowed!'
            });
        }
    })
    .delete((req, res, next) => {
        // Declarations
        var temp = null;
        const faceApi = req.app.get('faceApi');
        const blobStorage = req.app.get('blobStorage');

        // Get personGroupInfo for criminals
        const criminalPersonGroup = config.cognitiveService.personGroups.filter((group) => {
            return group.personGroupId === 'criminals';
        })[0];

        // Get containerName for criminals on blob storage
        const criminalContainer = config.azureBlob.containers.filter((container) => {
            return container.name === 'criminalimages';
        })[0];

        // Obtain criminalId from query params
        const criminalId = req.params.criminalId;

        // Delete criminal from database
        Criminal.findByIdAndRemove(criminalId)
            .then((result) => {
                // Assign result to temp
                temp = result;

                // Logging
                console.log(`Criminal record is successfully deleted from database with result: ${result}`);

                // Delete person from personGroup in cognitive services
                return faceApi.deletePerson(criminalPersonGroup.personGroupId, result.csPersonId);
            })
            .then((result) => {
                // Delete image from blob storage
                return blobStorage.deleteBlobIfExists(criminalContainer.name, temp.imageName);
            })
            .then((result) => {
                // Logging
                console.log(`Successfully deleted criminal from database, cognitive services & blob storage.`);

                // Return success to client
                res.json({
                    message: 'Criminal record is successfully deleted!'
                });

                // Train personGroup
                faceApi.trainPersonGroup(criminalPersonGroup.personGroupId);
            })
            .catch((err) => {
                // Log error
                console.log(`Delete criminal record error: ${err}`);

                // Return error to client
                return res.status(500).json({
                    message: 'An unexpected error occurred while trying to delete criminal record!'
                });
            });
    });

// // Testing route
// router.route('/recognize')
//     .post(upload.single('criminalImage'), (req, res, next) => {
//         // Declarations
//         const faceApi = req.app.get('faceApi');

//         // Image config
//         const imageBuffer = Buffer.from(req.file.buffer);

//         // Use recognition api
//         faceApi.recognize(imageBuffer, 'criminals', 1, 0.6)
//             .then((result) => {
//                 res.json(result);
//             })
//             .catch((err) => {
//                 return res.status(500).json({ message: err.message });
//             });
//     });

module.exports = router;