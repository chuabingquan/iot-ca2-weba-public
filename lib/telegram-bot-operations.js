'use strict';

// Require statements
const TelegramUser = require('../models/TelegramUser');

// Register telegram user with web app
exports.registerTelegramUser = (bot, msg) => {
    return new Promise((resolve, reject) => {
        // Check if user is already registered
        TelegramUser.count({
                chatId: msg.chat.id
            })
            .then((count) => {
                // If count is less than one, user is not registered
                if (count < 1) {
                    // Logging
                    console.log(`Telegram user, ${msg.chat.id}, is not registered.`);

                    // Construct data to store to database
                    let telegramUserData = new Object();

                    // Set values to telegramUserData object
                    telegramUserData.name = `${msg.chat.first_name} ${msg.chat.last_name}`;
                    telegramUserData.chatId = msg.chat.id;
                    if (msg.chat.username) {
                        telegramUserData.username = msg.chat.username;
                    }

                    // Store telegram user information to database
                    return TelegramUser.create(telegramUserData);
                }
                else {
                    return;
                }
            })
            .then((instance) => {
                // Logging
                console.log(`Telegram user registered in database.`);

                // Resolve promise with empty string
                return resolve('');
            })
            .catch((err) => {
                // Log error
                console.log(`Register telegram user error: ${err.message}`);

                // Reject promise with error
                return reject(err);
            });
    });
}

// Max text all resgistered telegram users
exports.massText = (bot, message) => {
    return new Promise((resolve, reject) => {
        // Get all registered telegram users
        TelegramUser.find()
            .then((users) => {
                // Check if there are registered users
                if (users.length <= 0) {
                    // Throw error if there are no registered users
                    var error = new Error(`There are no registered users to mass text to!`);
                    throw error;
                }
                
                // Loop through all users and send mass text
                users.forEach((user) => {
                    bot.sendMessage(user.chatId, message, {
                        parse_mode: 'HTML'
                    });
                }, this);
            })
            .catch((err) => {
                // Log error
                console.log(`Telegram mass text error: ${err}`);

                // Reject promise with error
                return reject(err);
            });
    });
}