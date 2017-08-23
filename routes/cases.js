'use strict';

// Require statements
var router = require('express').Router();
const url = require('url');
const querystring = require('querystring');
const sqvt = require('../lib/search-query-vuetable');
const Case = require('../models/Case');
const TelegramUser = require('../models/TelegramUser');
const telegramBotOperations = require('../lib/telegram-bot-operations');
const config = require('../config');

// Pagination GET API for New Cases /api/cases/newCases
router.route('/newCases')
    .get((req, res, next) => {
        // Declarations
        var caseCollectionCount = null;
        var error;
        var errMsg = '';

        // Collect pagination query parameters
        var sortQuery = req.query.sort;
        var pageNumberQuery = parseInt(req.query.page);
        var numberPerPageQuery = parseInt(req.query.per_page);

        // Validate values of query parameters
        if (isNaN(pageNumberQuery) || isNaN(numberPerPageQuery) || pageNumberQuery < 1 || numberPerPageQuery < 1) {
            return res.status(400).json({
                message: 'Error, invalid query parameters!'
            });
        }

        // Calculate offset for pagination
        var offsetForDb = numberPerPageQuery * (pageNumberQuery - 1);

        // Get case records from database with pagination
        Case.count({
                addressed: false
            })
            .then((count) => {
                console.log(`COUNT: ${count}`);
                // Assign count to variable
                caseCollectionCount = count;

                return Case.find({
                        addressed: false
                    }).skip(offsetForDb)
                    .limit(numberPerPageQuery)
                    .exec();
            })
            .then((instances) => {
                console.log(`INSTANCES: ${instances}`);
                // Create response objects for return
                var respObj = new Object();
                var respDataArr = new Array();
                var previousPageUrl;
                var nextPageUrl;
                var totalCount = caseCollectionCount;
                var lastPageValue = Math.ceil(totalCount / numberPerPageQuery);

                console.log(pageNumberQuery, lastPageValue);

                if (pageNumberQuery > lastPageValue) {
                    errMsg = `There are no more items for page number ${pageNumberQuery}`;
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Prepare nextPageUrl and previousPageUrl for return in response
                var requestUrl = url.parse(req.originalUrl);
                if (pageNumberQuery === 1) {
                    previousPageUrl = null;
                } else {
                    requestUrl.search = querystring.stringify(sqvt.generateSearchQuery(null, pageNumberQuery - 1, numberPerPageQuery));
                    previousPageUrl = url.format(requestUrl);
                }

                if (pageNumberQuery >= lastPageValue) {
                    nextPageUrl = null;
                } else {
                    requestUrl.search = querystring.stringify(sqvt.generateSearchQuery(null, pageNumberQuery + 1, numberPerPageQuery));
                    nextPageUrl = url.format(requestUrl);
                }

                // Prepare response object with data
                respObj.total = totalCount;
                respObj.per_page = numberPerPageQuery;
                respObj.current_page = pageNumberQuery;
                respObj.last_page = lastPageValue;
                respObj.next_page_url = nextPageUrl;
                respObj.prev_page_url = previousPageUrl;
                respObj.from = (((pageNumberQuery - 1) * numberPerPageQuery) + 1);
                if ((pageNumberQuery === lastPageValue) && (totalCount < (numberPerPageQuery * lastPageValue))) {
                    respObj.to = totalCount;
                } else {
                    respObj.to = pageNumberQuery * numberPerPageQuery;
                }
                respObj.data = instances;

                // Return data to client
                res.json(respObj);
            })
            .catch((err) => {
                // Log error
                console.log(`Get new cases by pagination error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred while trying to retrieve new cases records.`
                    });
                }
            });
    });

// Pagination GET API for pending Cases /api/cases/pendingCases
router.route('/pendingCases')
    .get((req, res, next) => {
        // Declarations
        var caseCollectionCount = null;
        var error;
        var errMsg = '';

        // Collect pagination query parameters
        var sortQuery = req.query.sort;
        var pageNumberQuery = parseInt(req.query.page);
        var numberPerPageQuery = parseInt(req.query.per_page);

        // Validate values of query parameters
        if (isNaN(pageNumberQuery) || isNaN(numberPerPageQuery) || pageNumberQuery < 1 || numberPerPageQuery < 1) {
            return res.status(400).json({
                message: 'Error, invalid query parameters!'
            });
        }

        // Calculate offset for pagination
        var offsetForDb = numberPerPageQuery * (pageNumberQuery - 1);

        // Get case records from database with pagination
        Case.count({
                addressed: true,
                resolved: false
            })
            .then((count) => {
                console.log(`COUNT: ${count}`);
                // Assign count to variable
                caseCollectionCount = count;

                return Case.find({
                        addressed: true,
                        resolved: false
                    }).skip(offsetForDb)
                    .limit(numberPerPageQuery)
                    .exec();
            })
            .then((instances) => {
                console.log(`INSTANCES: ${instances}`);
                // Create response objects for return
                var respObj = new Object();
                var respDataArr = new Array();
                var previousPageUrl;
                var nextPageUrl;
                var totalCount = caseCollectionCount;
                var lastPageValue = Math.ceil(totalCount / numberPerPageQuery);

                console.log(pageNumberQuery, lastPageValue);

                if (pageNumberQuery > lastPageValue) {
                    errMsg = `There are no more items for page number ${pageNumberQuery}`;
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Prepare nextPageUrl and previousPageUrl for return in response
                var requestUrl = url.parse(req.originalUrl);
                if (pageNumberQuery === 1) {
                    previousPageUrl = null;
                } else {
                    requestUrl.search = querystring.stringify(sqvt.generateSearchQuery(null, pageNumberQuery - 1, numberPerPageQuery));
                    previousPageUrl = url.format(requestUrl);
                }

                if (pageNumberQuery >= lastPageValue) {
                    nextPageUrl = null;
                } else {
                    requestUrl.search = querystring.stringify(sqvt.generateSearchQuery(null, pageNumberQuery + 1, numberPerPageQuery));
                    nextPageUrl = url.format(requestUrl);
                }

                // Prepare response object with data
                respObj.total = totalCount;
                respObj.per_page = numberPerPageQuery;
                respObj.current_page = pageNumberQuery;
                respObj.last_page = lastPageValue;
                respObj.next_page_url = nextPageUrl;
                respObj.prev_page_url = previousPageUrl;
                respObj.from = (((pageNumberQuery - 1) * numberPerPageQuery) + 1);
                if ((pageNumberQuery === lastPageValue) && (totalCount < (numberPerPageQuery * lastPageValue))) {
                    respObj.to = totalCount;
                } else {
                    respObj.to = pageNumberQuery * numberPerPageQuery;
                }
                respObj.data = instances;

                // Return data to client
                res.json(respObj);
            })
            .catch((err) => {
                // Log error
                console.log(`Get pending cases by pagination error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred while trying to retrieve pending cases records.`
                    });
                }
            });
    });

// Pagination GET API for archived Cases /api/cases/archivedCases
router.route('/archivedCases')
    .get((req, res, next) => {
        // Declarations
        var caseCollectionCount = null;
        var error;
        var errMsg = '';

        // Collect pagination query parameters
        var sortQuery = req.query.sort;
        var pageNumberQuery = parseInt(req.query.page);
        var numberPerPageQuery = parseInt(req.query.per_page);

        // Validate values of query parameters
        if (isNaN(pageNumberQuery) || isNaN(numberPerPageQuery) || pageNumberQuery < 1 || numberPerPageQuery < 1) {
            return res.status(400).json({
                message: 'Error, invalid query parameters!'
            });
        }

        // Calculate offset for pagination
        var offsetForDb = numberPerPageQuery * (pageNumberQuery - 1);

        // Get case records from database with pagination
        Case.count({
                addressed: true,
                resolved: true
            })
            .then((count) => {
                console.log(`COUNT: ${count}`);
                // Assign count to variable
                caseCollectionCount = count;

                return Case.find({
                        addressed: true,
                        resolved: true
                    }).skip(offsetForDb)
                    .limit(numberPerPageQuery)
                    .exec();
            })
            .then((instances) => {
                console.log(`INSTANCES: ${instances}`);
                // Create response objects for return
                var respObj = new Object();
                var respDataArr = new Array();
                var previousPageUrl;
                var nextPageUrl;
                var totalCount = caseCollectionCount;
                var lastPageValue = Math.ceil(totalCount / numberPerPageQuery);

                console.log(pageNumberQuery, lastPageValue);

                if (pageNumberQuery > lastPageValue) {
                    errMsg = `There are no more items for page number ${pageNumberQuery}`;
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Prepare nextPageUrl and previousPageUrl for return in response
                var requestUrl = url.parse(req.originalUrl);
                if (pageNumberQuery === 1) {
                    previousPageUrl = null;
                } else {
                    requestUrl.search = querystring.stringify(sqvt.generateSearchQuery(null, pageNumberQuery - 1, numberPerPageQuery));
                    previousPageUrl = url.format(requestUrl);
                }

                if (pageNumberQuery >= lastPageValue) {
                    nextPageUrl = null;
                } else {
                    requestUrl.search = querystring.stringify(sqvt.generateSearchQuery(null, pageNumberQuery + 1, numberPerPageQuery));
                    nextPageUrl = url.format(requestUrl);
                }

                // Prepare response object with data
                respObj.total = totalCount;
                respObj.per_page = numberPerPageQuery;
                respObj.current_page = pageNumberQuery;
                respObj.last_page = lastPageValue;
                respObj.next_page_url = nextPageUrl;
                respObj.prev_page_url = previousPageUrl;
                respObj.from = (((pageNumberQuery - 1) * numberPerPageQuery) + 1);
                if ((pageNumberQuery === lastPageValue) && (totalCount < (numberPerPageQuery * lastPageValue))) {
                    respObj.to = totalCount;
                } else {
                    respObj.to = pageNumberQuery * numberPerPageQuery;
                }
                respObj.data = instances;

                // Return data to client
                res.json(respObj);
            })
            .catch((err) => {
                // Log error
                console.log(`Get archived cases by pagination error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `An unexpected error occurred while trying to retrieve archived cases records.`
                    });
                }
            });
    });

// GET Case by Id /api/cases/caseId
router.route('/:caseId')
    .get((req, res, next) => {
        // Declarations
        var error;
        var errMsg = '';

        // Obtain caseId from params
        const caseId = req.params.caseId;

        // Find cases from database by id
        Case.findById(caseId)
            .populate('suspectPersonId')
            .exec()
            .then((instance) => {
                // Validate if instance exists
                if (!instance) {
                    // Throw error if instance does not exist
                    errMsg = 'Case does not exist!';
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }
                // Return instance to client
                res.json(instance);
            })
            .catch((err) => {
                // Log error
                console.log(`Get case by id error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `Unexpected error occurred while trying to get case by id!`
                    });
                }
            });
    });

// PUT API for false alarm /api/cases/caseId/falseAlarm
router.route('/:caseId/falseAlarm')
    .put((req, res, next) => {
        // Declarations
        var error;
        var errMsg = '';

        // Obtain caseId from params
        const caseId = req.params.caseId;

        // Update instance to ensure instance is classified into archived cases
        Case.findByIdAndUpdate(caseId, {
                addressed: true,
                resolved: true,
                isLegitimate: false
            })
            .then((updatedInstance) => {
                // Validate if updatedInstance exists
                if (!updatedInstance) {
                    // Throw error if updated case does not exist
                    errMsg = 'Case does not exist for being marked as false alarm!';
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Return result to client
                res.json({
                    message: `Case has been successfully been marked as a false alarm and shifted to archived cases.`
                });
            })
            .catch((err) => {
                // Log error
                console.log(`False alarm case error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `Unexpected error occured while trying to mark case as a false alarm!`
                    });
                }
            });
    });

// PUT API for respondCase /api/cases/caseId/respondCase
router.route('/:caseId/respondCase')
    .put((req, res, next) => {
        // Declarations
        var error;
        var errMsg = '';
        const bot = req.app.get('bot');
        var message = '';
        var tempInstance = null;

        // Obtain caseId from params
        const caseId = req.params.caseId;

        // Obtain user inputs
        const telegramMessage = req.body.telegramMessage;
        const offenceType = req.body.offenceType;

        // Update case by id to appear in pending cases
        Case.findByIdAndUpdate(caseId, {
                addressed: true,
                isLegitimate: true,
                telegramMessage: telegramMessage,
                offenceType: offenceType
            })
            .then((updatedInstance) => {
                // Validate if updatedInstance exist
                if (!updatedInstance) {
                    // Throw error if updated case does not exist
                    errMsg = 'Case does not exist for being marked as addressed and pending!';
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Assign updatedInstance to temp instance
                tempInstance = updatedInstance;

                // Return success to client side
                res.json({
                    message: `Success, telegram message is being issued and this case will be moved to pending cases till the issue is resolved.`
                });

                // Get caseimages container url
                var blobUrl = config.azureBlob.containers.filter((container) => {
                    return container.name === 'caseimages';
                })[0].url;

                // Construct message
                message = `<b>Suspicious Activity Alert</b>\n${telegramMessage}\n${blobUrl}${tempInstance.imageName}\n`;
                console.log(`Before send: `, message);

                // Send out telegram message to subscribed users
                telegramBotOperations.massText(bot, message);

            })
            .catch((err) => {
                // Log error
                console.log(`Move case to pending error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `Unexpected error occured while trying to send out telegram messages and shift case to pending till resolved!!`
                    });
                }
            });
    });

// PUT API for resolve case /api/cases/caseId/resolveCase
router.route('/:caseId/resolveCase')
    .put((req, res, next) => {
        // Declarations
        var error;
        var errMsg = '';
        const bot = req.app.get('bot');
        var message = '';
        var tempInstance = null;

        // Obtain caseId from params
        const caseId = req.params.caseId;

        // Update case by id and mark case as resolved
        Case.findByIdAndUpdate(caseId, {
                resolved: true
            })
            .then((updatedInstance) => {
                // Validate if updatedInstance exists
                if (!updatedInstance) {
                    // Throw error if case does not exist
                    errMsg = 'Case does not exist for being marked as resolved!';
                    error = new Error(errMsg);
                    error.status = 404;
                    throw error;
                }

                // Assign updatedInstance to tempInstance
                tempInstance = updatedInstance;

                // Return success to client
                res.json({
                    message: 'Case is successfully marked as resolved and can be found in the archived cases.'
                });

                // Telegram bot to issue message saying that the case is resolved
                // Get caseimages container url
                var blobUrl = config.azureBlob.containers.filter((container) => {
                    return container.name === 'caseimages';
                })[0].url;

                // Construct message
                message = `<b>Issue Resolved</b>\nIssue at ${tempInstance.location} is settled.\n${blobUrl}${tempInstance.imageName}\n`;
                console.log(`Before send: `, message);

                // Send out telegram message to subscribed users
                telegramBotOperations.massText(bot, message);
            })
            .catch((err) => {
                // Log error
                console.log(`Mark case as resolved error: ${err}`);

                // Return error to client
                if (errMsg !== '') {
                    return res.status(err.status).json({
                        message: err.message
                    });
                } else {
                    return res.status(500).json({
                        message: `Unexpected error occured while trying to send out telegram messages and mark case as resolved!`
                    });
                }
            });
    });

module.exports = router;