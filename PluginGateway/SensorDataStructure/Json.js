var Moment = require('moment-timezone');
var config = require('../../config');
function Json(){ };// class for Json data packet for generic sensor devices
Json.prototype.JSON_data = function (sensordata){
		
	//console.log(json_data);
	return JSON.stringify(sensordata);
};
module.exports = Json;