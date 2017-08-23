# iot-ca2-weba-public
NodeJS Web Application for Internet Of Things Assignment Part 2.

![alt text](https://github.com/chuabingquan/iot-ca2-weba-public/blob/master/cover.png "IoT CA2 Web Application")

### Description
For this project, [Mary Heng](https://github.com/maryheng) and I decided to build an IoT system which identifies suspicious activity when someone screams in a public area (like a park) for help. The system then attempts to recognize any threat with the aid of sensors and cloud AI services, then notify subscribed users about the threat via a telegram bot; All while firing an LED and Buzzer to intimidate the threat away.

This IoT solution comprises of three parts,
1. [Web Applcation (Vue.js)](https://github.com/maryheng/iot_ca2_adminconsole)
2. [Web Applcation (Node.js)](https://github.com/chuabingquan/iot-ca2-weba-public)
3. [Raspberry Pi Program (Python)](https://github.com/maryheng/iot_ca2_python)
4. Cloud Services (Cognitive Services Face API, AWS IOT, Azure Web App, CosmosDB with MongoDB API, Azure Blob Storage)

### Implementation
The web application for this IoT solution utilizes Vue.js 2 as the frontend SPA framework to allow users to manage sensor information that is abstracted by our backend using Node.js, CosmosDB (with MongoDB API) & Cloud Services. MQTT is also the key communication protocol between the Node.js server and the Raspberry Pi device to transmit lightweight payload (sensor data, instructions) over networks which are not particularly stable.

### Tutorial
To read up on our tutorial and replicate our project, please refer to the link [here](https://docs.google.com/document/d/1NjSPHQAQ5ei-1z0cWoALhp64PHk4aqrnIxbA_UwgbdY/edit)
