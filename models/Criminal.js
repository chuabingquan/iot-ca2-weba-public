// Require relevant modules
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Model Criminal Schema
const CriminalSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageName: {
        type: String,
        required: true
    },
    csPersonId: {
        type: String,
        required: true
    },
    faceId: [{
        type: String,
        required: false
    }]
}, {
    timestamps: true
});

// Export config as model
const Criminal = mongoose.model('Criminal', CriminalSchema);
module.exports = Criminal;