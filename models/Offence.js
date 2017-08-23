// Require relevant modules
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Model Offence Schema
const OffenceSchema = new Schema({
    offenceName: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

// Export config as model
const Offence = mongoose.model('Offence', OffenceSchema);
module.exports = Offence;