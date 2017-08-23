// Require relevant modules
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Model Preference Schema
const PreferenceSchema = new Schema({
    soundThreshold: {
        type: Number,
        min: [1, 'Sound threshold cannot be less than 1%.'],
        max: [100, 'Sound threshold cannot be more than 100%'],
        required: true
    },
    soundMetricValue: {
        type: Number,
        required: true
    },
    seeded: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: true
});

// Export config as model
const Preference = mongoose.model('Preference', PreferenceSchema);
module.exports = Preference;