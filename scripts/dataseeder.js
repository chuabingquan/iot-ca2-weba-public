'use strict';

// Require statements
const mongoose = require('mongoose');
const Preference = require('../models/Preference');
const config = require('../config');

// Mongoose configurations
mongoose.Promise = global.Promise;

// Connect to MongoDB
mongoose.connect(config.azureDB.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error on data seeding: '));
db.once('open', () => {
    // Logging on successful connection to database
    console.log('Database ready for data seeding...');

    // Seed data
    Preference.count({})
        .then((count) => {
            // Validate if there is already an existing single record
            if (count < 1) {
                // Logging
                console.log('No existing sound threshold preferences, creating one now...');

                // Create sound threshold preference if no records exists
                return Preference.create({
                    soundThreshold: 50,
                    soundMetricValue: 1024,
                    seeded: true
                });
            } else {
                // Logging
                console.log('There are existing sound threshold preferences, all will be removed and a new record will be created in place.');

                // Destroy all existing sound threshold preferences before seeding a new one
                return Preference.remove({})
                    .then((result) => {
                        // Logging
                        console.log('All existing sound threshold preference is removed.');

                        // Recreate new preferences
                        return Preference.create({
                            soundThreshold: 50,
                            soundMetricValue: 1024,
                            seeded: true
                        });
                    });
            }
        })
        .then((result) => {
            // Logging
            console.log(`Successsfully seeded sound preferences.`);
            db.close();
        })
        .catch((err) => {
            // Log error
            console.log(`Sound preferences seeding error: ${err}`);
            db.close();
        });
});