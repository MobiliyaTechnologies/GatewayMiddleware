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
 * @summary: Send RSSI of XY Beacon to Azure IoTHub 
 *******************************************************************************/

var bus = require('../../eventbus');
var List = require("collections/list");
var FastMap = require("collections/fast-map");
var config = require('../../config');
var groupList = new List();
var lat = 0;
var lng = 0;
var cloudAdaptor;
var dataWrapper;
var sendRSSIInterval;
var previousRssiHashMap = new FastMap();
var averageNumber = 9;


function XYBeacon () { };//class for XYBeacon

XYBeacon.prototype.XYBeaconHandler = function (CloudAdaptor,DataWrapper){ // Geolocation handler
	cloudAdaptor = CloudAdaptor;
	dataWrapper = DataWrapper;

	console.log("XYBeacon.Prototype.XYBeaconHandler ", new Date());
};

XYBeacon.prototype.Discovered = function(SensorKey, rssi, sensorDetails) {
    console.log('XYBeacon ' + SensorKey + ' ' + rssi);
    if(rssi > 0) {
        return;
    }
    console.log("milliseconds " , +new Date());
/*
    if (previousRssiHashMap.has(SensorKey)) {
        var previousRssi = previousRssiHashMap.get(senderId);
        if (previousRssi.length < averageNumber) {
            previousRssi.add(rssi);
            if (System.currentTimeMillis() - timestampHashMap.get(senderId) < maxUpdateTime) {
                timestampHashMap.put(senderId, System.currentTimeMillis());
                return;
            }
        }
    } else {
        ArrayList<Integer> previousRssi = new ArrayList<>();
        previousRssi.add(rssi);
        previousRssiHashMap.put(senderId, previousRssi);
        timestampHashMap.put(senderId, System.currentTimeMillis());
        timestampLastSentHashMap.put(senderId, System.currentTimeMillis());
        return;
    }
    */
};

function startSendingAtInterval() {
	sendRSSIInterval = setInterval(sendRSSI, config.RSSIDataIntervalMax);
}

var azureClientConnected = function() {
	stopSendingAtInterval();
	//sendRSSI();
	startSendingAtInterval();
}

var azureClientDisconnected = function() {
	stopSendingAtInterval();
}

var sendRSSI = function () {
    console.log("send RSSI");
	/*try {
		if(groupList && groupList.length > 0) {
			if (lat == 0 && lng == 0) {
				lat = config.Latitude;
				lng = config.Longitude;
			}
			console.log("Geolocation  SENT: " + lat + " " + lng);
			//var json_data = {GroupIds:groupList.toArray(),Latitude:lat,Longitude:lng,Timestamp:new Date()};
            var json_data = {SensorKey:SensorDetails.SensorKey,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
														AssetBarcode:SensorDetails.AssetBarcode,RSSI:rssi};
			cloudAdaptor(dataWrapper(json_data)); // pushing the data to cloud
		} else {
			console.log("Stop Sending RSSI, not sensor connected");
			stopSendingAtInterval();
		}
	} catch (error) {
		console.log(error);
	}*/
}

var stopSendingAtInterval = function() {
	clearInterval(sendRSSIInterval);
}

bus.on('azureClientConnected', azureClientConnected);
bus.on('azureClientDisconnected', azureClientDisconnected);

module.exports = XYBeacon;