'use strict';

//var getmac = require('getmac');
var jsonfile = require('jsonfile');
var bus = require('./eventbus');
var fs = require('fs');

var file = 'sensorlist.json';
var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
var client = null;

/*
getmac.getMac(function(err,macAddress){
    if (err)  {
        console.log(err);
        return;
    }
	console.log(macAddress);
	
	var connectionString = 'HostName=AssetIOTHub.azure-devices.net;DeviceId=' + macAddress + ';SharedAccessKey=yN0Tlpn18dnNwhCiKTuCTfT+BhMHK2rF36D0OoFECf8=';
	client = clientFromConnectionString(connectionString);
	client.open(connectCallback);
});*/

fs.readFile('././connectionString.txt', 'utf8', function (err,data) {
	  if (err) {
		console.log(err);
		  return;
	  }
		console.log(data);
		var connectionString = data;
		client = clientFromConnectionString(connectionString);
		client.open(connectCallback);
});

function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
};

var connectCallback = function (err) {
  if (err) {
    console.log('Could not connect: ' + err);
  } else {
    console.log('Client connected');
    client.on('message', function (msg) {
      console.log('Message Received - Id: ' + msg.messageId + ' Body: ' + msg.data);
      //client.complete(msg, printResultFor('completed'));
		if (isJSON((msg.data).toString())) {
			console.log("JSON");
			console.log((msg.data).toString());
			saveData((msg.data).toString());
		}
    });
  }
};

function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
		console.log(e);
        return false;
    }
    return true;
}

var saveData = function(msg) {
	try {
		jsonfile.readFile(file, function(err, obj) {
			if(obj == undefined) {
				obj = {};
			}
			var message = JSON.parse(msg);
			console.dir(JSON.stringify(obj));
			console.log('Received Mesage ', message);
            if(!message.hasOwnProperty('EnableSensor')) {
				console.log("Invalid JSON");
                return;
            }
			var key = message.EnableSensor.SensorKey;
			console.log('key : ' + key);
			console.log('Status : ' + message.Status);
			if(message.Status == "Attach") {
				console.log('sensor attached');
				obj[key] = message;
			} else if(message.Status == "Detach") {
				console.log('sensor detached');
				if(obj.hasOwnProperty(key)){
					console.log('sensor deleted');
					delete obj[key];
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