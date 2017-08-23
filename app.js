'use strict';

// Require statements
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const awsIot = require('aws-iot-device-sdk');
const uuidv4 = require('uuid/v4');
const config = require('./config');
const Mscsfa = require('./lib/mscsfa-custom');
const AzureBlobCustom = require('./lib/azure-blob-custom');
const blobSvc = require('azure-storage').createBlobService(config.azureBlob.storageAccountName, config.azureBlob.key);
const mqttOperations = require('./lib/mqtt-operations');
const telegramBotOperations = require('./lib/telegram-bot-operations');
const history = require('./lib/connect-history-api-fallback-custom');

// Require routes
const index = require('./routes/index');
const criminals = require('./routes/criminals');
const preferences = require('./routes/preferences');
const offences = require('./routes/offences');
const cases = require('./routes/cases');
const stats = require('./routes/stats');

// Instantiations
var app = express();

// SocketIO
const io = socketio();
app.io = io;

// Cloud Services
const faceApi = new Mscsfa(config.cognitiveService.cognitiveServicesKey, config.cognitiveService.regionCode);
app.set('faceApi', faceApi);

const blobStorage = new AzureBlobCustom(blobSvc);
app.set('blobStorage', blobStorage);

// Mongoose configurations
mongoose.Promise = global.Promise;

// Connect to MongoDB
mongoose.connect(config.azureDB.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', () => {
  console.log('Connected to database!');
});

// SocketIO configurations
io.on('connection', (socket) => {
  // Remove all listeners on connection to prevent multiple connections from a single client
  socket.removeAllListeners();

  // Logging
  console.log('Client connected to socket!');

  // Emit back on connection
  io.emit('message', 'Connected to socket!');
});

// Telegram Bot configurations
const bot = new TelegramBot(config.telegram.token, {
  polling: true
});
app.set('bot', bot);

// Triggered when someone uses the Telegram bot for the first time
bot.onText(/\/start/, (msg, match) => {
  // Obtain chatId
  const chatId = msg.chat.id;

  // Register user to database
  telegramBotOperations.registerTelegramUser(bot, msg);

  // Return response to user
  var resp = `Hi ${msg.chat.first_name} ${msg.chat.last_name}, my name is surveillance bot and I will notify you if there are any ongoing threats or crime occuring in Singapore! My objective is to help raise vigilance in our community and prompt users around to help those who are in need during threatening occasions.`;
  bot.sendMessage(chatId, resp);
});

// AWS IOT configurations
var device = awsIot.device({
  keyPath: path.join(__dirname, `/lib/aws-iot/${config.awsIot.keyPath}`),
  certPath: path.join(__dirname, `/lib/aws-iot/${config.awsIot.certPath}`),
  caPath: path.join(__dirname, `/lib/aws-iot/${config.awsIot.caPath}`),
  clientId: config.awsIot.clientId,
  host: config.awsIot.host
});

// Make device available in routers
app.set('device', device);

// MQTT events
device.on('connect', () => {
  // Logging
  console.log('Connected to MQTT Broker.');

  // Subscribe to topic
  device.subscribe(config.mqttTopics.piConnectedTopic);
  device.subscribe(config.mqttTopics.sensorAlertTopic);
  // device.publish(config.mqttTopics.piConnectedTopic, "1");
});

// Subscribed topics callback
device.on('message', (topic, payload) => {
  // Control flow to determine topic
  if (topic === config.mqttTopics.piConnectedTopic) {
    // Logging
    console.log(`In control flow for subscribed topic: ${config.mqttTopics.piConnectedTopic}`);

    // Retrieve sound threshold and return to Pi
    mqttOperations.getSoundThreshold()
      .then((soundThresholdValue) => {
        // Publish value to sound threshold preference topic
        device.publish(config.mqttTopics.soundThresholdPreferenceTopic, JSON.stringify({
          soundThreshold: soundThresholdValue
        }));
      })
      .catch((err) => {
        // Log error
        console.log(`MQTT get sound threshold from db error: ${err}`);
        // Publish value to sound threshold preference topic
        device.publish(config.mqttTopics.soundThresholdPreferenceTopic, JSON.stringify({
          soundThreshold: 350
        }));
      });
  } else if (topic === config.mqttTopics.sensorAlertTopic) {
    // Logging
    console.log(`In control flow for subscribed topic: ${config.mqttTopics.sensorAlertTopic}`);

    // Parse payload
    var parsedPayload = JSON.parse(payload.toString());

    // Obtain necessary values
    var location = parsedPayload.location;
    var soundValue = parsedPayload.sound;
    var imageName = `${uuidv4()}-${new Date().toISOString()}.jpg`;    
    var imageBuffer = Buffer.from(parsedPayload.image, 'base64');
    var byteLength = imageBuffer.byteLength;

    // Get personGroupId
    var personGroupId = config.cognitiveService.personGroups.filter((group) => {
      return group.personGroupId === 'criminals';
    })[0].personGroupId;

    // Get container name
    var containerName = config.azureBlob.containers.filter((container) => {
      return container.name === 'caseimages';
    })[0].name;

    // Invoke processCaseAfterMqtt
    mqttOperations.processCaseAfterMqtt(faceApi, blobStorage, imageBuffer, personGroupId, 
      config.cognitiveService.maxNumOfCandidatesReturned, config.cognitiveService.minimumConfidence, containerName, imageName, byteLength, location, soundValue)
      .then((result) => {
        // Logging
        console.log(result);
      })
      .catch((err) => {
        // Log error
        console.log(`Process Case After MQTT error in MQTT callback: ${err}`);
      });
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(history({
  verbose: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Routing
app.use('/', index);
app.use('/api/criminals', criminals);
app.use('/api/preferences', preferences);
app.use('/api/offences', offences);
app.use('/api/cases', cases);
app.use('/api/stats', stats);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    message: err.message
  });
});

module.exports = app;