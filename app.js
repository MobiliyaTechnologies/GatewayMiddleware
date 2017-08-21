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

//var { app, BrowserWindow } = require('electron')
// OR
// Three Lines
var electron = require('electron');
var app1 = electron.app;
var BrowserWindow = electron.BrowserWindow;


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
		 console.log("open url 'http://localhost:65159/' in browser");
		 bus.emit('log',"Please Login !");
		 
		  console.log(err);
	  } else {
		console.log("Connection String Exists !!");
		bus.emit('log',"Connection String Exists !!");
		require('./main');
	  }
	});
}

setTimeout(getConnectionString, 7000);


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

var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  console.log('Login page running on port ' + port);
});

getmac.getMac(function(err,macAddress){
    if (err)  throw err
    console.log(macAddress);
	MAC = macAddress;
})