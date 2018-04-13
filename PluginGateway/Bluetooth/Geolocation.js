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
 * @summary: Send Gateway Geolocation to Azure IoTHub 
 *******************************************************************************/

var bus = require('../../eventbus');
var List = require("collections/list");
var config = require('../../config');
var groupList = new List();
var lat = 0;
var lng = 0;
var cloudAdaptor;
var dataWrapper;
var sendGeolocationInterval;

//Add group in list:
var addGroup = function (groupId) {
	//console.log("Geolocation addGroup");
	if(!groupList.has(groupId)) {
		//console.log("Geolocation Group added");
		groupList.push(groupId);

		sendGeolocation();
		startSendingAtInterval();
    }
}
//Remove group in list:
var removeGroup = function (groupId) {
	//console.log("Geolocation removeGroup");
	groupList.delete(groupId);
}

var removeAllGroups = function (groupId) {
	//console.log("Geolocation removeGroup");
	groupList.clear();
	stopSendingAtInterval();
}

var setGeolocation = function (body) {
	console.log("setGeolocation", body);	  
	  lat = body.latitude;
	  lng = body.longitude;
}

function Geolocation () { };//class for Geolocation
Geolocation.prototype.GeolocationHandler = function (CloudAdaptor,DataWrapper){ // Geolocation handler
	cloudAdaptor = CloudAdaptor;
	dataWrapper = DataWrapper;

	console.log("Geolocation.Prototype.GeolocationHandler ", new Date());
};

function startSendingAtInterval() {
	sendGeolocationInterval = setInterval(sendGeolocation, config.GPSDataInterval);
}

var azureClientConnected = function() {
	stopSendingAtInterval();
	sendGeolocation();
	startSendingAtInterval();
}

var azureClientDisconnected = function() {
	stopSendingAtInterval();
}

var sendGeolocation = function () {
	try {
		if(groupList && groupList.length > 0) {
			if (lat == 0 && lng == 0) {
				lat = config.Latitude;
				lng = config.Longitude;
			}
			console.log("Geolocation  SENT: " + lat + " " + lng);
			var json_data = {GroupIds:groupList.toArray(),Latitude:lat,Longitude:lng,Timestamp:new Date()};
			cloudAdaptor(dataWrapper(json_data)); // pushing the data to cloud
		} else {
			console.log("Stop Sending Geolocation, not sensor connected");
			stopSendingAtInterval();
		}
	} catch (error) {
		console.log(error);
	}
}

var stopSendingAtInterval = function() {
	clearInterval(sendGeolocationInterval);
}

//Assign the event handler to an event:
bus.on('sensor_group_connected', addGroup);
bus.on('sensor_group_disconnected', removeGroup);
bus.on('all_sensor_group_disconnected', removeAllGroups);
bus.on('azureClientConnected', azureClientConnected);
bus.on('azureClientDisconnected', azureClientDisconnected);
bus.on('setGeolocation', setGeolocation);

module.exports = Geolocation;