// Require relevant modules
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Model TelegramUser Schema
const TelegramUserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        default: 'NO USERNAME'
    },
    chatId: {
        type: Number,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

// Export config as model
const TelegramUser = mongoose.model('TelegramUser', TelegramUserSchema);
module.exports = TelegramUser;