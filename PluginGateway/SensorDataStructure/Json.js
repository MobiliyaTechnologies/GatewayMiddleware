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
	json_data = { 
					//"temperature":sensordata.temperature,
					"x": sensordata.x,
					"y": sensordata.y,
					"z": sensordata.z,
				 	//"timestamp": Moment.tz(config.GatewayTimezone).format().replace(/T/,' ').replace(/\+..+/,'') //removing T and everything after the .
				 	//"timestamp": new Date().getTime()
					"timestamp": new Date()
					};
	//console.log(json_data);
	return JSON.stringify(json_data)
};
module.exports = Json;