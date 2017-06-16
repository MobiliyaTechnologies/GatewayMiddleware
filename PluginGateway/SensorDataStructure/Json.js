var Moment = require('moment-timezone');
var config = require('../../config');
function Json(){ };// class for Json data packet for generic sensor devices
Json.prototype.JSON_data = function (sensorid,sname,sensorservice,sensordata){
	/*
	json_data = {   "versionId":"1.0.0",
					"gatewayId":config.GatewayID,
					//"gps":[{"longuitude":Math.floor((Math.random() * 180) - 90),"latitude": Math.floor((Math.random() * 180) -90)}],	
				 	"gps":[{"longuitude":18.5568,"latitude":73.7935}],
					"sserialno":sensorid,
					"sname":sname,
					"datatype":sensorservice,
					"data": sensordata,
				 	//"timestamp": Moment.tz(config.GatewayTimezone).format().replace(/T/,' ').replace(/\+..+/,'') //removing T and everything after the .
				 	"timestamp": new Date().getTime()
					};
	//console.log(json_data);
	*/
	/*
	var data = null;
	var capability = null;
	var capabilityId = 0;
	if(sname == "SensorTag2650") {
		capability = "temperature";
		capabilityId = 1;
		data = {
			"temperature":sensordata.temperature,
			"timestamp": new Date()
		};
		
	} else if(sname == "SensorTag1350") {
		capability = "temperature";
		capabilityId = 1;
		data = {
			"temperature":sensordata.temperature,
			"timestamp": new Date()
		};
		
	} else if(sname == "ThundeBoard-React") {
		capability = "Luminescence";
		capabilityId = 1;
		data = {
			"Luminescence":sensordata.Luminescence,
			"timestamp": new Date()
		};
		
	} else {
		capability = "accelerometer";
		capabilityId = 2;
		data = { 
			"x": sensordata.x,
			"y": sensordata.y,
			"z": sensordata.z,
			//"timestamp": Moment.tz(config.GatewayTimezone).format().replace(/T/,' ').replace(/\+..+/,'') //removing T and everything after the .
			//"timestamp": new Date().getTime()
			"timestamp": new Date()
			};
	}
	
	json_data = { 
			"type":sname,
			"data": data,
			"capability": capability,
			"capabilityId": capabilityId,
			"timestamp": new Date()
	};
	*/
	
	//console.log(json_data);
	return JSON.stringify(sensordata);
};
module.exports = Json;