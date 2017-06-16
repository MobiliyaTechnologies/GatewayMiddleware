var express = require('express');
var path = require('path');
var app = express();
var getmac = require('getmac');
var MAC = null;
var connectionString = null;
var fs=require('fs');
var file = "connectionString.txt";
var bodyParser = require('body-parser');

//continue this file if connection string exists else go to login
fs.readFile(file, 'utf-8', function (err,data) {
	  if (err) {
		 console.log("Connection String Does Not Exists !!");
		 console.log("Please Login !!");
      console.log("open url 'http://localhost:65159/' in browser");
		 console.log(err);
	  } else {
		console.log("Connection String Exists !!");
		require('./main');
	  }
});

// Define the port to run on
app.set('port', 65159);
app.use(express.static(path.join(__dirname, 'public')));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());

app.get('/macaddress', function (req, res) {
    console.log( MAC );
    res.end( MAC );
})
app.post('/connectionstring', function (req, res) {
	console.log(req.body);
	connectionString = req.body.connectionString;
	console.log(connectionString);
	fs.writeFile('./connectionString.txt', connectionString , 'utf-8');

	require('./main');
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