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
 * @summary: Get list of whitelisted sensors
 *******************************************************************************/

var config = require('../../config');
var http = require('http');
var fs = require('fs');
var getWhitelist = function getWhitelist(cb) {
	http.get({
		port:80,
        host: config.OnboardSensorIP,
        path: '/listonboardsensor'
 //		path: "/GetAllEnableSensors"
	}, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            // Data reception is done, do whatever with it!
            console.log("body");
			console.log(body);
			fs.writeFile('whitelist.json', body, 'utf8', function(){
				console.log("Json retrived and wrote to file");
			});
			var content = JSON.parse(body);
			console.log("content.data");
			console.log(content.data);
			if(content.data){
				var whitelistAddress = [];
				content.data.forEach(function(item){
					whitelistAddress.push(item.sserialno);
				});
				//console.log("Following whitelist address found :",whitelistAddress);
				return cb(whitelistAddress,content.data);
				//for (var i=0; j=content.data.length, i<j; i++){
				//	whitelistAddress += content.data[i].sserialno;
			}else{
				console.log("NO whitelisted sesnors found !, message is :",content.message)
			}
        });
    });
}
module.exports = getWhitelist;