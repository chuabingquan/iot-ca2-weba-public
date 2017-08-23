'use strict';

// Require statements
var router = require('express').Router();
const config = require('../config');
const Preference = require('../models/Preference');

// GET API Sound Threshold Preferences /api/preferences/soundThreshold
router.route('/soundThreshold')
    .get((req, res, next) => {
        // Declarations
        var error;
        var errMsg = '';

        // Find soundThreshold preferences
        Preference.findOne({
                seeded: true
            })
            .then((instance) => {
                // Validate if instance exists
                if (instance === null) {
                    // Construct and throw error
                    errMsg = 'Fatal error, data seeding issue at first deploy, please contact system administrators ASAP.'
                    error = new Error(errMsg);
                    error.status = 500;
                    throw error;
                }
                // Construct respObject
                let respObject = new Object();
                respObject.soundThreshold = instance.soundThreshold;

                // Return respObject to client
                res.json(respObject);
            })
            .catch((err) => {
                // Log error
                console.log(`Get sound threshold preferences error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred while trying to retrieve your sound threshold preference!`
                    });
                }
            });
    })
    .put((req, res, next) => {
        // Declarations
        var error;
        var errMsg = '';
        var device = req.app.get('device');

        // Obtain user inputs
        let soundThreshold = req.body.soundThreshold;

        // Commit changes to database
        Preference.findOneAndUpdate({
            seeded: true
        }, {
            soundThreshold: soundThreshold
        }, { runValidators: true })
        .then((updatedInstance) => {
            // Throw error if instance to update does not exist
            if (!updatedInstance) {
                errMsg = 'Fatal error, data seeding issue at first deploy, please contact system administrators ASAP.';
                error = new Error(errMsg);
                error.status = 500;
                throw error;
            }

            // Calculate threshold value
            let thresholdValue = ((soundThreshold/100) * updatedInstance.soundMetricValue);

            // Publish updated sound threshold to MQTT
            device.publish(config.mqttTopics.soundThresholdPreferenceTopic, JSON.stringify({ soundThreshold: thresholdValue }));

            // Return success to client
            res.json({ message: 'Successfully updated sound threshold!' });
        })
        .catch((err) => {
            // Log error
            console.log(`Update sound threshold preference error: ${err}`);

            // Return error to client
            if (errMsg !== '') {
                return res.status(err.status).json({ message: err.message });
            } 
            else if (err.name == 'ValidationError') {
                return res.status(400).json({ message: err.message });
            }
            else {
                return res.status(500).json({ message: 'An unexpected error occurred while trying to update your sound threshold preference!' });
            }
        });
    });

module.exports = router;