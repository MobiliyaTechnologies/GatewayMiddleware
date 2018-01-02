var request = require('request');
var config = require('./config');
var getmac = require('getmac');
var https = require("https");
var fs = require('fs');
var connectionStringFile = "connectionString.txt";
var capabilitiesFile = "capabilities.json";
var MAC = null;
const readline = require('readline');
var restServerUrl;
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
            getRestUrl();
            //login();
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

function getRestUrl() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter Rest Server URL for your Domain: ', (answer) => {
        rl.close();
        // Yes: ask userId, No: exit
        if (answer) {
            console.log("answer:",answer);
            if (answer == "") {
                console.log("URL cannot be empty");
                getRestUrl();
            }
            if (answer.charAt(answer.length-1) == "/") {
                answer = answer.substring(0, answer.length-1);
            }
            restServerUrl = answer;
            login();
        } else {
            console.log("Invalid URL");
            getRestUrl();
        }
    });
}

function getConnectionString(userId) {
    //console.log("ServerUrl", restServerUrl);
    if (restServerUrl == undefined || restServerUrl.length<1) {
        getRestUrl();
        return;
    }

    // Set the headers
    var headers = {
        'User-Agent': 'RigadoIoTGateway',
        'Content-Type': 'application/json',
	    'UserId': userId
    }

    // Configure the request
    var options = {
        url: restServerUrl + '/api/ConsoleIotHubGateway',
        method: 'POST',
        headers: headers,
        form: {'GatewayKey': MAC},
	//key: fs.readFileSync('./certs/client1-key.pem'), // Certificate Key.
	//cert: fs.readFileSync('./certs/client1-crt.pem') // Certificate.
    }

    // Start the request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            //console.log("body", body);
            body = JSON.parse(body);
            //console.log("body", body);
            //save connection string
            saveCapabilities(body.Capabilities);
            //save capabilities
            saveConnectionString(body.DeviceConnectionString);
            //start scanning
            startScanning();
        } else {
            if (!response) {
                console.log("Something went wrong !!");
                console.log("Please verify your Rest Server URL");
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.question('Do you want to try again? (yes/no): ', (answer) => {
                    rl.close();
                    // Yes: ask userId, No: exit
                    if (answer == "yes" || answer == "YES" || answer == "Yes") {
                        getRestUrl();
                    }
                });
            } else {
                if (request.statusCode != undefined) {
                    console.log("statusCode", request.statusCode);
                    console.log(body);
                    try {
                        body = JSON.parse(body);
                        console.log(body.Message);
                    } catch (error) {
                        console.log(error);
                    }
                } else {
                    console.log("Error in login. Error:", error);
                    console.log("Please check whether Gateway is registered or not");
                }
                //console.log("Error in login", error);
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.question('Do you want to try again? (yes/no): ', (answer) => {
                    rl.close();
                    // Yes: ask userId, No: exit
                    if (answer == "yes" || answer == "YES" || answer == "Yes") {
                        login();
                    }
                });
            }
        }
    })
}

function saveConnectionString(connectionString) {
	//console.log("connectionString", connectionString);
	fs.writeFileSync('./' + connectionStringFile, connectionString , 'utf-8');
}

function saveCapabilities(capabilities) {
	//console.log("capabilities", capabilities);
	fs.writeFileSync('./' + capabilitiesFile, JSON.stringify(capabilities), 'utf-8');
}