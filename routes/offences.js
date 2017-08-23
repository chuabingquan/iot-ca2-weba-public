'use strict';

// Require statements
var router = require('express').Router();
const config = require('../config');
const url = require('url');
const querystring = require('querystring');
const sqvt = require('../lib/search-query-vuetable');
const Offence = require('../models/Offence');

// Chain GET & POST API /api/offences
router.route('/')
    .get((req, res, next) => {
        // Declarations
        var offenceCollectionCount = null;
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
        Offence.count({})
            .then((count) => {
                console.log(`COUNT: ${count}`);
                // Assign count to variable
                offenceCollectionCount = count;

                return Offence.find().skip(offsetForDb)
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
                var totalCount = offenceCollectionCount;
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
                console.log(`Get offences by pagination error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred while trying to retrieve offences records.`
                    });
                }
            });
    })
    .post((req, res, next) => {
        // Collect user inputs
        const offenceName = req.body.offenceName;

        // Create an offence record
        Offence.create({
                offenceName: offenceName
            })
            .then((instance) => {
                // Logging
                console.log(`Successfully created new offence type.`);

                // Return success to client
                res.json({
                    message: `Offence type is successfully created!`
                });
            })
            .catch((err) => {
                // Log error
                console.log(`Create offence record error: ${err}`);

                // Return error to client
                return res.status(500).json({
                    message: `An unexpected error occured while trying to create an offence type!`
                });
            });
    });

// Get offences for options /api/offences/options
router.route('/options')
    .get((req, res, next) => {
        // Get all offences
        Offence.find()
            .then((instances) => {
                // Return instances to client
                res.json(instances);
            })
            .catch((err) => {
                // Log error
                console.log(`Get offences for options error: ${err}`);
            
                // Return error to client
                return res.status(500).json({ message: `Unexpected error, failed to get offences for options!` });
            });
    });

// Chain GET(id) PUT & DELETE API /api/offences/offenceId
router.route('/:offenceId')
    .get((req, res, next) => {
        // Declarations
        var errMsg = '';
        var error;

        // Obtain offenceId
        const offenceId = req.params.offenceId;
    
        // Retrieve offence from database by id
        Offence.findById(offenceId)
            .then((instance) => {
                // Check if instance exists or not
                if (!instance) {
                    errMsg = 'Offence type is not found!';
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }
            
                // Return success to client
                res.json(instance);
            })
            .catch((err) => {
                // Log error
                console.log(`Get offence by id error: ${err}`);
                
                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({ message: err.message });
                }
                else {
                    return res.status(500).json({ message: 'Unexpected error occurred while getting offence type!' });
                }
            });
    })
    .put((req, res, next) => {
        // Declarations
        var errMsg = '';
        var error;

        // Obtain offenceId
        const offenceId = req.params.offenceId;

        // Obtain user inputs
        const offenceName = req.body.offenceName;

        // Find offence record by id and update
        Offence.findByIdAndUpdate(offenceId, {
                offenceName: offenceName
            })
            .then((instance) => {
                // Check from instance if record exists or not
                if (!instance) {
                    // Throw error if offence does not exist
                    errMsg = 'Offence type does not exist for updating!';
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Logging
                console.log(`Successfully updated offence record.`);

                // Return success to client
                res.json({
                    message: `Offence type is successfully updated!`
                });
            })
            .catch((err) => {
                // Log error
                console.log(`Update offence error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred while updating offence type!`
                    });
                }
            });
    })
    .delete((req, res, next) => {
        // Declarations
        var errMsg = '';
        var error;

        // Obtain offenceId
        const offenceId = req.params.offenceId;

        // Delete offence record by id
        Offence.findByIdAndRemove(offenceId)
            .then((deletedInstance) => {
                // Check if offence record existed for deletion
                if (!deletedInstance) {
                    // Throw error if deleted instance does not exist
                    errMsg = 'Offence type does not exist for deletion!';
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Return success to client
                res.json({
                    message: `Offence type is successfully deleted!`
                });
            })
            .catch((err) => {
                // Log error
                console.log(`Delete offence record error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred when deleting offence type!`
                    });
                }
            })
    });

module.exports = router;
