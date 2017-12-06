var request = require('request');
var config = require('./config');
var getmac = require('getmac');
var fs = require('fs');
var connectionStringFile = "connectionString.txt";
var capabilitiesFile = "capabilities.json";
var MAC = null;
/*
//Creating app insights client
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
*/
//continue this file if connection string exists else go to login
var isConnectionStringExists = function() {
	fs.readFile(connectionStringFile, 'utf-8', function (err,data) {
	  if (err) {
			console.log("Connection String Does Not Exists !!");
		    //console.log(err);
            login();
	  } else {
			console.log("Connection String Exists !!");
            startScanning();
	  }
	});
}

function startScanning() {
    require('./main');
}

//get MAC address for this Gateway
getmac.getMac(function(err,macAddress){
    if (err) {
		//client.trackException(err);
        console.log("unable to found MAC Address for this Gateway!!!")
		throw err;
	}
    console.log("GatewayKey", macAddress);
	MAC = macAddress;
})

setTimeout(isConnectionStringExists, 2000);

function login() {
    if(MAC) {
        console.log("User Login Required, please enter required details");
        //Read UserId and GatewayKey from console input
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('UserId: ', (answer) => {
            // TODO: Log the answer in a database
            console.log("Logging in for user", answer);
            rl.close();
            getConnectionString(answer);
        });
    } else {
        console.log("MAC Address not available, can't login!!!")
    }
}

function getConnectionString(userId) {
    // Set the headers
    var headers = {
        'User-Agent': 'RigadoIoTGateway',
        'Content-Type': 'application/json'
    }

    // Configure the request
    var options = {
        url: 'https://assetmonitoring.azurewebsites.net/Api/AnonymousIotHubGateway',
        method: 'POST',
        headers: headers,
        form: {'UserId': userId, 'GatewayKey': MAC}
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log("body", body);
            body = JSON.parse(body);
            //console.log("body", body);
            //save connection string
            saveCapabilities(body.Capabilities);
            //save capabilities
            saveConnectionString(body.DeviceConnectionString);
            //start scanning
            startScanning();
        } else {
            console.log("Error in login", error);
        }
    })
}

function saveConnectionString(connectionString) {
	console.log("connectionString", connectionString);
	fs.writeFileSync('./' + connectionStringFile, connectionString , 'utf-8');
}

function saveCapabilities(capabilities) {
	console.log("capabilities", capabilities);
	fs.writeFileSync('./' + capabilitiesFile, capabilities , 'utf-8');
}