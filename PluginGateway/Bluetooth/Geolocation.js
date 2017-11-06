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

//Add group in list:
var addGroup = function (groupId) {
	//console.log("Geolocation addGroup");
	if(!groupList.has(groupId)) {
		//console.log("Geolocation Group added");
		groupList.push(groupId);
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
}

var setGeolocation = function (body) {
	console.log("setGeolocation", body);	  
	  lat = body.latitude;
	  lng = body.longitude;
}

bus.on('setGeolocation', setGeolocation);

function Geolocation () { };//class for Geolocation
Geolocation.prototype.GeolocationHandler = function (CloudAdaptor,DataWrapper){ // Geolocation handler
	console.log("Geolocation.Prototype.GeolocationHandler ", new Date());	
	
	//Assign the event handler to an event:
	bus.on('sensor_group_connected', addGroup);
	bus.on('sensor_group_disconnected', removeGroup);
	bus.on('all_sensor_group_disconnected', removeAllGroups);
	
	setInterval(function() {
		if (lat == 0 && lng == 0) {
			lat = config.Latitude;
			lng = config.Longitude;
		}
		console.log("Geolocation  SENT: " + lat + " " + lng);
		var json_data = {GroupIds:groupList.toArray(),Latitude:lat,Longitude:lng,Timestamp:new Date()};
		CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
	}, config.GPSDataInterval);
};

module.exports = Geolocation;