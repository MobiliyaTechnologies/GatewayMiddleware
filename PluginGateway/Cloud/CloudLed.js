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
 * @summary: Control LED indicator on Gateway 
 *******************************************************************************/

var util = require('util');
var exec = require('child_process').exec;
var CloudLed = function CloudLed (cloudled){
	exec("echo "+ cloudled +" > /sys/class/gpio/gpio346/value",function(){
		console.log("Cloud Led :", cloudled);
	});
};

//function puts(error,stdout,stderr) {console.log(stdout)};

/*
function blink(){
	setTimeout(function(){exec("echo 0 > /sys/class/gpio/gpio346/value",puts)},1000);
	exec("echo 1 > /sys/class/gpio/gpio346/value",puts);
}
setInterval(function(){
	blink();
},2000);
*/
module.exports = CloudLed;