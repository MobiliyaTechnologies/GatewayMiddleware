var bus = require('../../eventbus');
var List = require("collections/list");
var config = require('../../config');
var groupList = new List();

//Add group in list:
var addGroup = function (groupId) {
	console.log("Geolocation addGroup");
	if(!groupList.has(groupId)) {
	console.log("Geolocation Group added");
		groupList.push(groupId);
    }
}
//Remove group in list:
var removeGroup = function (groupId) {
	console.log("Geolocation removeGroup");
	groupList.delete(groupId);
}

function Geolocation () { };//class for SensorTag1350
Geolocation.prototype.GeolocationHandler = function (CloudAdaptor,DataWrapper){ // sensor tag 1350 handle
	console.log("Geolocation.Prototype.GeolocationHandler ", new Date());	
	
	//Assign the event handler to an event:
	bus.on('sensor_group_connected', addGroup);
	bus.on('sensor_group_disconnected', removeGroup);
	
	setInterval(function() {
		if (groupList.length > 0) {
			console.log("Geolocation  sent");
			var json_data = {GroupId:groupList.toArray(),Latitude:config.Latitude,Longitude:config.Longitude,Timestamp:new Date()};
			CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
		} else {
			console.log("Geolocation not sent");
		}
	}, 3000);
	
	
	
};

module.exports = Geolocation;