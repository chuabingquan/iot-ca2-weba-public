'use strict';

const request = require('request-promise-native');
const uuidv4 = require('uuid/v4');

// Azure Blob Custom constructor
function AzureBlobCustom (blobSvc) {
    this.blobSvc = blobSvc;
}

// Create container to store blob
AzureBlobCustom.prototype.createContainerIfNotExists = function (containerName) {
    return new Promise((resolve, reject) => {
        this.blobSvc.createContainerIfNotExists(containerName, (error, result, response) => {
            if (error) {
                console.log(`Create container error: ${error}`);
                return reject(error);
            }
            // console.log(`Create container result: ${result}`);
            // console.log(`Create container response: ${response}`);
            const success = true;
            return resolve(success);
        });
    });
}

// Stream and upload blob to Azure Blob Storage
AzureBlobCustom.prototype.createBlockBlobFromStream = function (containerName, imageName, imageStream, byteLength) {
    return new Promise((resolve, reject) => {
        this.blobSvc.createBlockBlobFromStream(containerName, imageName, imageStream, byteLength, (error, result, response) => {
            if (error) {
                console.log(`Create block blob from stream error: ${error} `);
                return reject(error);
            }
            // console.log(`Create block blob from stream result: ${result}`);
            // console.log(`Create block blob from stream response: ${response}`);
            const success = true;
            return resolve(success);
        });
    });
}

// Get blob from Azure Blob Storage and write blob to root of application
AzureBlobCustom.prototype.getBlobToStream = function (containerName, imageName, fs) {
    return new Promise((resolve, reject) => {
        this.blobSvc.getBlobToStream(containerName, imageName, fs.createWriteStream(uuidv4()), (error, result, response) => {
            if (error) {
                console.log(`Get blob to stream error: ${error}`);
                return reject(error);
            }
            // console.log(`Get blob to stream result: ${result}`);
            // console.log(`Get blob to stream response: ${response}`);
            const success = true;
            return resolve(success);
        });
    });
}

// Delete blob from Azure Blob Storage
AzureBlobCustom.prototype.deleteBlobIfExists = function (containerName, imageName) {
    return new Promise((resolve, reject) => {
        this.blobSvc.deleteBlobIfExists(containerName, imageName, (error, result, response) => {
            if (error) {
                console.log(`Delete if blob exists error: ${error}`);
                return reject(error);
            }
            console.log(`Delete if blob exists result: ${result}`);
            const success = true;
            return resolve(success);
        });
    });
}

// Upload Image wrapper for existing methods mentioned above
AzureBlobCustom.prototype.uploadImage = function (containerName, imageName, imageStream, byteLength) {
    return new Promise((resolve, reject) => {
        this.createContainerIfNotExists(containerName)
            .then((result) => {
                console.log('Container creation successful.');
                return this.createBlockBlobFromStream(containerName, imageName, imageStream, byteLength);
            })
            .then((result) => {
                console.log('Image successfully uploaded!');
                return resolve('Image upload complete!');
            })
            .catch((err) => {
                console.log(`Error occured: ${err}`);
                return reject(err);
            });
    });
}

module.exports = AzureBlobCustom;