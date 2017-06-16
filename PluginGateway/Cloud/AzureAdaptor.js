// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

//'use strict';

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

var file = 'sensorlist.json';

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"
//var connectionString = "HostName=AssetIOTHub.azure-devices.net;DeviceId=mySecondDevice;SharedAccessKey=lHwO1mM76ApXn3bGtsN8vQcY3UMSM0w/IrlyjTzpWjk=";
var connectionString = null;
var client = null;

function AzureAdaptor () {};

AzureAdaptor.prototype.AzureHandle= function (json_data) {
      var message = new Message(json_data);
      //message.properties.add('temperatureAlert', (temperature > 28) ? 'true' : 'false');
      console.log('Sending message: ' + message.getData());
      client.sendEvent(message, printResultFor('send'));
};

AzureAdaptor.prototype.AzureInit = function (cb) {
	console.log("AzureAdaptor.prototype.AzureInit");
	fs.readFile('././connectionString.txt', 'utf8', function (err,data) {
	  if (err) {
		console.log(err);
	  }
		console.log(data);
		connectionString = data;
		
		//connectionString = "HostName=AssetIOTHub.azure-devices.net;DeviceId=mySecondDevice;SharedAccessKey=lHwO1mM76ApXn3bGtsN8vQcY3UMSM0w/IrlyjTzpWjk=";
		
		// fromConnectionString must specify a transport constructor, coming from any transport package.
		client = Client.fromConnectionString(connectionString, Protocol);

			client.open(function (err) {
		  if (err) {
			console.error('Could not connect: ' + err.message);
		  } else {
			console.log('azure iot sdk connected');
			cb();
			client.on('message', function (msg) {
				console.log('Message Received ! Id: ' + msg.messageId + ' Body: ' + msg.data + ' PropertyList:  ', msg.properties.propertyList[0]);
					if (isJSON((msg.data).toString())) {
						console.log("JSON");
						//console.log((msg.data).toString());
						
						if(msg.properties.propertyList[0].hasOwnProperty('key')) {
							var status = msg.properties.propertyList[0].value;
							//console.log('status : ', status);
							saveData((msg.data).toString(), status);
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
			  console.error(err.message);
			});

			client.on('disconnect', function () {
			  //clearInterval(sendInterval);
			  client.removeAllListeners();
			  client.open(connectCallback);
			});
		  }
		});
	});
};
// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
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
		jsonfile.readFile(file, function(err, obj) {
			if(obj == undefined) {
				obj = {};
			}
			var message = JSON.parse(msg);
			//console.log(message);
			for(var sensorDetail in message) {
				//console.log('Sensor Detail ', message[sensorDetail]);
				if(!message[sensorDetail].hasOwnProperty('SensorKey')) {
					console.log("Invalid JSON");
					//return;
				} else {
					var key = message[sensorDetail].SensorKey;
					//console.log('key : ' + key);
					if(status == "Attach") {
						obj[key] = message[sensorDetail];
					} else {
						if(obj.hasOwnProperty(key)){
							console.log('sensor ' + key + ' deleted');
							delete obj[key];
						}
					}	
				}
			}
			console.log('writing file');
			console.log(JSON.stringify(obj));
			jsonfile.writeFile(file, obj, function (err) {
			    if(err) {
				    console.error(err);
			    }
				console.log('Emit update event !');
				bus.emit('updatelist');
			});
		});
	} catch (err) {
		// handle the error safely
		console.log(err);
	}
}

module.exports = AzureAdaptor;