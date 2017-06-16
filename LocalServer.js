var express = require('express');
var app = express();
var getmac = require('getmac');
var MAC = null;
var connectionString = null;

app.get('/macaddress', function (req, res) {
    console.log( MAC );
    res.end( MAC );
})


app.post('/connectionstring', function (req, res) {
	connectionString = req.body.connectionstring;
	console.log(connectionString);
  	res.sendStatus(200);
})

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Local Server listening at http://127.0.0.1:%s", host, port)

})

getmac.getMac(function(err,macAddress){
    if (err)  throw err
    console.log(macAddress);
	MAC = macAddress;
})