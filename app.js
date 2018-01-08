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
 * @summary: Create electron window and express server.
 *******************************************************************************/

'use strict';
var express = require('express');
var path = require('path');
var app = express();
var getmac = require('getmac');
var MAC = null;
var connectionString = null;
var capabilities = null;
var fs=require('fs');
var file = "connectionString.txt";
var bodyParser = require('body-parser');
var bus = require('./eventbus');
//var open = require('opn');
var cors = require('cors');

console.log("Creating app insights client");
let appInsights = require('applicationinsights');
let client;
try {
		appInsights.setup("37feed53-76b6-44a9-b877-d0469f3743fb").start();
		client = appInsights.client;
		//client.trackException(new Error("handled exceptions on Gateway"));
} catch (error) {
		console.log('Error in initializing appInsights client.');
		console.log(error);
}
//var { app, BrowserWindow } = require('electron')
// OR
// Three Lines
var electron = require('electron');
var app1 = electron.app;
var BrowserWindow = electron.BrowserWindow;

//Google API key
//AIzaSyCnvrW9m3U2n0IRqG5JSd2vZy0Dch41WIQ
process.env.GOOGLE_API_KEY = "AIzaSyCnvrW9m3U2n0IRqG5JSd2vZy0Dch41WIQ";

var mainWindow = null;
app1.commandLine.appendSwitch("ignore-certificate-errors");
app1.on('ready', function() {
	mainWindow = new BrowserWindow({ width: 700, height: 650,
		show: true,
		webPreferences: {
	  	nodeIntegration: false,
			webSecurity: false
			}
		}
	);
	//mainWindow.openDevTools();
	mainWindow.loadURL('http://localhost:65159/');
});
app1.on('window-all-closed', app1.quit);


require('./ws_server');
//require('./ws_client');
console.log("Opening browser window..");
bus.emit('log',"Opening browser window..");
//open('http://localhost:65159/');

//continue this file if connection string exists else go to login
var getConnectionString = function() {
	fs.readFile(file, 'utf-8', function (err,data) {
	  if (err) {
			console.log("Connection String Does Not Exists !!");
			bus.emit('log',"Connection String Does Not Exists !!");
			console.log("Please Login !!");
			bus.emit('log',"Please Login !!");
			//console.log("open url 'http://localhost:65159/' in browser");
			//bus.emit('log',"Please Login !");
		 
		  console.log(err);
	  } else {
			console.log("Connection String Exists !!");
			bus.emit('log',"Connection String Exists !!");
			require('./main');
	  }
	});
}

setTimeout(getConnectionString, 3000);

// Define the port to run on
app.set('port', 65159);
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());

app.get('/macaddress', function (req, res) {
    console.log( MAC );
    res.end( MAC );
})
app.get('/version', function (req, res) {
    
	var config = require('./config');
	console.log( config.Version );
    res.end( config.Version );
})

app.get('/timeout', function (req, res) {
    var config = require('./config');
    var BLEConnectionDuration = config.BLEConnectionDuration.toString();
    fs.readFile('./connectionTimeout.txt', 'utf8', function (err,data) {
        if (!err) {
            BLEConnectionDuration = data;
        }
        res.end(BLEConnectionDuration);
    });
});

app.post('/timeout', function (req, res) {
	var config = require('./config');
    config.BLEConnectionDuration = req.body.timeout;
    config.BLEReconnectionInterval = config.BLEConnectionDuration + 500;
	fs.writeFileSync('./connectionTimeout.txt', config.BLEConnectionDuration, 'utf-8');
    res.sendStatus(200);
})

app.post('/geolocation', function (req, res) {
	console.log("emit setGeolocation ", req.body);
	bus.emit('setGeolocation',req.body);
	res.sendStatus(200);
})

app.post('/connectionstring', function (req, res) {
	console.log(req.body);
	connectionString = req.body.connectionString;
	console.log(connectionString);
	fs.writeFileSync('./connectionString.txt', connectionString , 'utf-8');

	require('./main');
  res.sendStatus(200);
})
app.post('/capabilities', function (req, res) {
	//console.log(req.body);
	capabilities = req.body.capabilities;
	//console.log(capabilities);
	fs.writeFileSync('./capabilities.json', capabilities , 'utf-8');

	//require('./main');
  res.sendStatus(200);
})

function deleteFiles(files, callback){
  var i = files.length;
  files.forEach(function(filepath){
	  
	console.log("deleting "+ filepath);
    fs.unlink(filepath, function(err) {
      i--;
      if (err) {
        callback(err);
        return;
      } else if (i <= 0) {
        callback(null);
      }
    });
  });
}

app.get('/resetgateway', function (req, res) {
	console.log("resetgateway api call");
	
	bus.emit('stopGateway');
	var files = ['./connectionString.txt', './capabilities.json', './sensorlist.json','./sensorTypes.json', './connectionTimeout.txt'];
	
	deleteFiles(files, function(err) {
		if (err) {
			console.log(err);
			client.trackException(err);
		} else {
			console.log('all files removed');
		}
	});
	
	bus.emit('log', '\n--------------------------\nGateway has been reset.\nPlease Restart Gateway !!!\n--------------------------\n');
	res.sendStatus(200);
})

var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  console.log('Login page running on port ' + port);
});

getmac.getMac(function(err,macAddress){
    if (err) {
			client.trackException(err);
			throw err;
		}
    console.log(macAddress);
		MAC = macAddress;
})
