'use strict';

const Preference = require('../models/Preference');
const Case = require('../models/Case');
const Criminal = require('../models/Criminal');
const streamifier = require('streamifier');


exports.getSoundThreshold = () => {
    return new Promise((resolve, reject) => {
        // Get sound threshold preference from database
        Preference.findOne({
                seeded: true
            })
            .then((instance) => {
                // Check if instance exists
                if (!instance) {
                    // Logging
                    console.log(`There is no sound threshold seeded in the database at the moment, default of 350 will be used.`);
                    throw new Error('No sound threshold is seeded in database.');
                }
                // Calculate sound threshold
                let thresholdValue = ((instance.soundThreshold / 100) * instance.soundMetricValue);

                // Resolve promise with threshold value
                return resolve(thresholdValue);
            })
            .catch((err) => {
                // Log error
                console.log(`Get sound threshold for MQTT error: ${err}`);

                // Reject promise with error
                return reject(err);
            })
    });
}

exports.processCaseAfterMqtt = (faceApi, blobStorage, image, personGroupId, maxNumOfCandidatesReturned, minimumConfidence, containerName, imageName, byteLength, location, soundValue) => {
    return new Promise((resolve, reject) => {
        // Declarations
        var tempCandidate = null;
        var dataToDb = new Object();

        // Run recognize from faceAPI
        faceApi.recognize(streamifier.createReadStream(image), personGroupId, maxNumOfCandidatesReturned, minimumConfidence)
            .then((candidate) => {
                // Logging
                console.log(`Successfully completed facial recognition for case.`);

                // Assign candidate to tempCandidate
                tempCandidate = candidate;
                console.log(`Candidate is: ${JSON.stringify(tempCandidate)}`);

                // Upload image to azure blob storage
                return blobStorage.uploadImage(containerName, imageName, streamifier.createReadStream(image), byteLength);
            })
            .then((result) => {
                // Logging
                console.log(`Successfully uploaded case image to blob.`);
                console.log(tempCandidate);

                if (tempCandidate) {
                    // Logging
                    console.log(`Finding user with matching personId.`);
                    // Find instance with matching csPersonId
                    return Criminal.findOne({
                        csPersonId: tempCandidate.personId
                    });
                }
                else {
                    return;
                }
            })
            .then((instance) => {
                // Logging
                console.log(`Completed database search for instance with matching personId.`);

                // Assign values to construct dataToDb
                dataToDb.location = location;
                dataToDb.triggeredSoundValue = soundValue;
                dataToDb.imageName = imageName;
                if (instance) {
                    dataToDb.suspectPersonId = instance._id;
                }

                // Commit data to database
                return Case.create(dataToDb);
            })
            .then((instance) => {
                // Logging
                console.log(`Successfully created Case in database.`);

                // Resolve promise
                return resolve('Successfully created a case from MQTT.');
            })
            .catch((err) => {
                // Log error
                console.log(`processCaseAfterMqtt error: ${err.message}`);

                // Reject promise with error
                return reject(err);
            });
    });
}