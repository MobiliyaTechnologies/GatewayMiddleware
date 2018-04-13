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
 * @summary: Data format to be sent to server
 *******************************************************************************/

var Moment = require('moment-timezone');
var config = require('../../config');
function Json(){ };// class for Json data packet for generic sensor devices
Json.prototype.JSON_data = function (sensordata){
		
	//console.log(json_data);
	return JSON.stringify(sensordata);
};
module.exports = Json;