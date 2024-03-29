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
 * @summary: Send IP address to server 
 *******************************************************************************/

var http = require('http');
var config = require('../../config');
var exec = require('child_process').exec;
var os = require('os');
var ifaces = os.networkInterfaces();
//callback function to make http post request to server to update ip
function puts(stdout){
	var IP = stdout;	
	console.log("Current IP is :",IP);
	var postData = JSON.stringify({
		 "data":
			{
			"shipmentId": config.GatewayID,
			"shipmentName": IP,
			"timestamp":new Date().getTime()
			}
		});
	console.log(postData);
	var options = {
	  hostname: config.OnboardSensorIP,
	  port: 80,
	  path: '/addgateway',
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json'
		  }
	};

	var req = http.request(options, (res) => {
	  console.log(`Cloud IP Update STATUS: ${res.statusCode}`);
	  //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
	  res.setEncoding('utf8');
	  res.on('data', (chunk) => {
		console.log(`BODY: ${chunk}`);
	  });
	  res.on('end', () => {
		console.log('No more data in response.');
	  });
	});
	req.on('error', (e) => {
	  console.log(`problem with request: ${e.message}`);
	});

	// write data to request body
	req.write(postData);
	req.end();

};

var UpdateIP = function UpdateIP (){
	// fires a linux command which rerieves a ip address of the internet connected wan interface
	
	Object.keys(ifaces).forEach(function (ifname) {
	  var alias = 0;

	  ifaces[ifname].forEach(function (iface) {
		if ('IPv4' !== iface.family || iface.internal !== false) {
		  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
		  return;
		}

		if (alias >= 1) {
		  // this single interface has multiple ipv4 addresses
		  console.log(ifname + ':' + alias, iface.address);
		} else {
		  // this interface has only one ipv4 adress
		  console.log(ifname, ":" , iface.address);
		  puts(iface.address);
		}
		++alias;
	  });
	});
	//exec("hostname -I",puts);// old depricated, only specific to ubuntu
};
//UpdateIP();// for debuggin purpose
module.exports = UpdateIP;


