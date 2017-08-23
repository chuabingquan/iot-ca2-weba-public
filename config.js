'use strict';

module.exports = {
    azureDB: {
        url: 'YOUR_CLOUD_MONGODB_URL'
    },
    localDB: {
        url: 'YOUR_LOCAL_MONGODB_URL'
    },
    cognitiveService: {
        cognitiveServicesKey: 'YOUR_COGNITIVE_SERVICE_KEY',
        regionCode: 'SEA',
        personGroups: [{
            personGroupId: 'criminals',
            personGroupName: 'Criminals',
            personGroupDescription: 'Identified criminals for IOT-CA2 project.'
        }],
        minimumConfidence: 0.6,
        maxNumOfCandidatesReturned: 1
    },
    telegram: {
        token: 'YOUR_TELEGRAM_TOKEN'
    },
    awsIot: {
        keyPath: 'YOUR_AWS_IOT_PRIVATE_KEY',
        certPath: 'YOUR_AWS_IOT_CERTIFICATE',
        caPath: 'YOUR_AWS_IOT_CA',
        clientId: 'YOUR_CLIENT_ID',
        host: 'YOUR_AWS_IOT_HOST'
    },
    azureBlob: {
        storageAccountName: 'YOUR_STORAGE_ACCOUNT_NAME',
        key: 'YOUR_AZURE_STORAGE_KEY',
        containers: [{
            name: 'criminalimages',
            url: 'YOUR_AZURE_CONTAINER_URL_1'
        }, {
            name: 'caseimages',
            url: 'YOUR_AZURE_CONTAINER_URL_2'
        }]
    },
    mqttTopics: {
        piConnectedTopic: 'devices/pi/connected',
        soundThresholdPreferenceTopic: 'preferences/soundThreshold',
        sensorAlertTopic: 'sensors/alert'
    }
}
