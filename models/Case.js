// Require relevant modules
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Model Case Schema
const CaseSchema = new Schema({
    location: {
        type: String,
        required: true
    },
    imageName: {
        type: String,
        required: true
    },
    triggeredSoundValue: {
        type: Number,
        required: true
    },
    suspectPersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criminal'
    },
    addressed: {
        type: Boolean,
        default: false
    },
    isLegitimate: {
        type: Boolean
    },
    telegramMessage: {
        type: String
    },
    offenceType: {
        type: String
    },
    resolved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Export config as model
const Case = mongoose.model('Case', CaseSchema);
module.exports = Case;