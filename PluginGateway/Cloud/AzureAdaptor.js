/*******************************************************************************
 * Copyright(c) 2017-2018 Mobiliya Technologies
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 *
 * @author: Gaurav Wable, Mobiliya
 * @version: 1.03
 * @summary: Connect with Azure IoTHub and send data 
 *******************************************************************************/

 var Protocol = require('azure-iot-device-mqtt').Mqtt;
// Uncomment one of these transports and then change it in fromConnectionString to test other transports
// var Protocol = require('azure-iot-device-amqp').AmqpWs;
//var Protocol = require('azure-iot-device-http').Http;
// var Protocol = require('azure-iot-device-amqp').Amqp;
//var Protocol = require('azure-iot-device-mqtt').MqttWs;
var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;

var jsonfile = require('jsonfile');
var bus = require('../../eventbus');
var fs = require('fs');

var sensorListFile = 'sensorlist.json';
var SensorTypesFile = 'sensorTypes.json';

let appInsights = require('applicationinsights');
let appInsightsClient = appInsights.client;

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"
//var connectionString = "HostName=AssetIOTHub.azure-devices.net;DeviceId=mySecondDevice;SharedAccessKey=lHwO1mM76ApXn3bGtsN8vQcY3UMSM0w/IrlyjTzpWjk=";
var connectionString = null;
var client = null;

function AzureAdaptor () {};

AzureAdaptor.prototype.AzureHandle= function (json_data) {
	try {
		var message = new Message(json_data);
		//message.properties.add('temperatureAlert', (temperature > 28) ? 'true' : 'false');
		message.properties.add('MessageType', 'Sensor');
		console.log('Sending message: ' + message.getData());
		client.sendEvent(message, printResultFor('send'));
	} catch(error) {
		console.log(error);
	}
};

AzureAdaptor.prototype.AzureStop = function (cb) {
	client.close(function(err) {
		if(err) {
			console.log("Error in closing Azure client");
			console.log(err);
		}
		cb();
	});
}

AzureAdaptor.prototype.AzureInit = function (cb) {
	console.log("AzureAdaptor.prototype.AzureInit");
	bus.emit('log','Initiating Azure Adapter');
	try {
		fs.readFile('././connectionString.txt', 'utf8', function (err,data) {
			if (err) {
				console.log(err);
				appInsightsClient.trackException(err);
			}
			console.log(data);
			connectionString = data;

			if(connectionString === undefined || connectionString == null || connectionString == "") {
				return;
			}
			
			//connectionString = "HostName=AssetIOTHub.azure-devices.net;DeviceId=mySecondDevice;SharedAccessKey=lHwO1mM76ApXn3bGtsN8vQcY3UMSM0w/IrlyjTzpWjk=";
			
			// fromConnectionString must specify a transport constructor, coming from any transport package.
			client = Client.fromConnectionString(connectionString, Protocol);

			client.open(function (err) {
				if (err) {
					console.error('Could not connect: ' + err.message);
					appInsightsClient.trackException(err);
					bus.emit('log','Could not connect to Azure');
					bus.emit('azureClientDisconnected');
				} else {
					console.log('Azure Iot Sdk Connected');
					bus.emit('log','Azure Iot Sdk Connected');
					cb();
					bus.emit('azureClientConnected');
					
					client.on('message', function (msg) {
						console.log("CloudToDevice Message Received");
						console.log('Message Received ! Id: ' + msg.messageId + ' Body: ' + msg.data + ' PropertyList:  ', msg.properties.propertyList[0]);
						if (msg.properties.propertyList[0] != undefined) {
							if (isJSON((msg.data).toString())) {
								console.log("JSON");
								//console.log((msg.data).toString());

								if(msg.properties.propertyList[0].hasOwnProperty('key')) {
									var status = msg.properties.propertyList[0].value;
									//console.log('status : ', status);
									saveData((msg.data).toString(), status);
								}
							}
						}
						// When using MQTT the following line is a no-op.
						client.complete(msg, printResultFor('completed'));
						// The AMQP and HTTP transports also have the notion of completing, rejecting or abandoning the message.
						// When completing a message, the service that sent the C2D message is notified that the message has been processed.
						// When rejecting a message, the service that sent the C2D message is notified that the message won't be processed by the device. the method to use is client.reject(msg, callback).
						// When abandoning the message, IoT Hub will immediately try to resend it. The method to use is client.abandon(msg, callback).
						// MQTT is simpler: it accepts the message by default, and doesn't support rejecting or abandoning a message.
						});
						// Create a message and send it to the IoT Hub every second
					
					client.on('error', function (err) {
						console.log("Error in Azure client ", err);
						appInsightsClient.trackException(err);
						bus.emit('log', "Error connecting with Azure client");
						bus.emit('azureClientDisconnected');
					});

					client.on('disconnect', function () {
						//clearInterval(sendInterval);
						console.log("Azure client disconnected");
						client.removeAllListeners();
						//client.open(connectCallback);
						bus.emit('log',"Azure client disconnected");
						bus.emit('azureClientDisconnected');
					});
				}
			});
		});
	} catch(error) {
		console.log(error);
	}
};
// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
		appInsightsClient.trackException(err);
		console.log(op + ' error: ' + err.toString());
	}
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}


function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
		console.log(e);
        return false;
    }
    return true;
}

var saveData = function(msg, status) {
	try {
		if(status == "AttachSensor" || status == "DetachSensor") {
				if (fs.existsSync(sensorListFile)) {
					var obj = jsonfile.readFileSync(sensorListFile, "utf8");
				}
				if (obj == undefined || obj == null) {
					obj = {};
				}
				var message = JSON.parse(msg);
				//console.log(message);
				for(var sensorDetail in message) {
					//console.log('Sensor Detail ', message[sensorDetail]);
					if(!message[sensorDetail].hasOwnProperty('SensorKey')) {
						console.log("Invalid Sensor JSON");
						//return;
					} else {
						var key = message[sensorDetail].SensorKey;
						//console.log('key : ' + key);
						if(status == "AttachSensor") {
							obj[key] = message[sensorDetail];
						} else if(status == "DetachSensor") {
							if(obj.hasOwnProperty(key)){
								console.log('sensor ' + key + ' deleted');
								delete obj[key];
							}
						}	
					}
				}
				console.log('writing file');
				//console.log(JSON.stringify(obj));
				jsonfile.writeFileSync(sensorListFile, obj, {"encoding":'utf8'});
				/*	if(err) {
						console.error(err);
						console.log('Error updating SensorList file !');
					}
				*/
				console.log('Emit update SensorList event !');
				bus.emit('updatelist');
		} else if(status == "AttachSensorType" || status == "DetachSensorType") {
				if (fs.existsSync(SensorTypesFile)) {
					var obj = jsonfile.readFileSync(SensorTypesFile, "utf8");
				}
				if (obj == undefined || obj == null) {
					obj = {};
				}
				var message = JSON.parse(msg);
				//console.log(message);
				for(var sensorDetail in message) {
					//console.log('Sensor Detail ', message[sensorDetail]);
					if(!message[sensorDetail].hasOwnProperty('SensorType')) {
						console.log("Invalid SensorType JSON");
						//return;
					} else {
						var key = message[sensorDetail].SensorType;
						//console.log('key : ' + key);
						if(status == "AttachSensorType") {
							obj[key] = message[sensorDetail];
						} else if(status == "DetachSensorType") {
							if(obj.hasOwnProperty(key)){
								console.log('sensor ' + key + ' deleted');
								delete obj[key];
							}
						}	
					}
				}
				console.log('writing file');
				//console.log(JSON.stringify(obj));
				jsonfile.writeFileSync(SensorTypesFile, obj, {"encoding":'utf8'});
				/*	if(err) {
						console.log('Error updating SensorType file !');
						console.error(err);
					}*/
				console.log('Emit update SensorType event !');
				bus.emit('updateSensorTypes');
		}
	} catch (err) {
		// handle the error safely
		console.log(err);
		appInsightsClient.trackException(err);
	}
}

module.exports = AzureAdaptor;
