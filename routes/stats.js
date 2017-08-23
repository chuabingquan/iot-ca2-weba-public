'use strict';

// Require statements
var router = require('express').Router();
const Case = require('../models/Case');
const moment = require('moment-timezone');

// GET API for number of false alarms today /api/stats/falseAlarms
router.route('/falseAlarms')
    .get((req, res, next) => {
        // Generate dates
        var startOfToday = moment.utc().startOf('day').format();
        var endOfToday = moment.utc().endOf('day').format();

        console.log(startOfToday, endOfToday);

        // Get false alarms for today from database
        Case.count({
                isLegitimate: false,
                createdAt: {
                    $gte: startOfToday,
                    $lte: endOfToday
                }
            })
            .then((count) => {
                // Logging
                console.log(`Number of false alarm as of now today: ${count}`);

                // Return count to client
                res.json({
                    count: count
                });
            })
            .catch((err) => {
                // Log error
                console.log(`Get falseAlarms for today error: ${err}`);

                // Return unexpected error
                return res.status(500).json({
                    message: `Unexpected error, failed to retrieve false alarms for today!`
                });
            })
    });

// GET API for number of times system got triggered today /api/stats/triggered
router.route('/triggered')
    .get((req, res, next) => {
        // Generate dates
        var startOfToday = moment.utc().startOf('day').format();
        var endOfToday = moment.utc().endOf('day').format();

        console.log(startOfToday, endOfToday);

        // Get times system got triggered for today from database
        Case.count({
                createdAt: {
                    $gte: startOfToday,
                    $lte: endOfToday
                }
            })
            .then((count) => {
                // Logging
                console.log(`Number of times system got triggered today: ${count}`);

                // Return count to client
                res.json({
                    count: count
                });
            })
            .catch((err) => {
                // Log error
                console.log(`Get times system got triggered today error: ${err}`);

                // Return unexpected error
                return res.status(500).json({
                    message: `Unexpected error, failed to retrieve times system got triggered for today!`
                });
            })
    });

module.exports = router;