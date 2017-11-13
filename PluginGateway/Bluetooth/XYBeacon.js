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
var timestampHashMap = new FastMap();
var timestampLastSentHashMap = new FastMap();
var averageNumber = 9;
var movingAgerages;
var dbRange = 120;


function XYBeacon () { };//class for XYBeacon

XYBeacon.prototype.XYBeaconHandler = function (CloudAdaptor,DataWrapper){ // Geolocation handler
	cloudAdaptor = CloudAdaptor;
	dataWrapper = DataWrapper;
	//console.log("XYBeacon.Prototype.XYBeaconHandler ", new Date());
};

XYBeacon.prototype.Discovered = function(sensorDetails, rssi) {
    //console.log('XYBeacon ' + sensorDetails.SensorKey + ' ' + rssi);
    if(rssi > 0) {
        return;
    }
    //console.log("milliseconds " , Date.now());
    var senderId = sensorDetails.SensorKey;
    if (previousRssiHashMap.has(senderId)) {
        var previousRssi = previousRssiHashMap.get(senderId);
        if (previousRssi.length < averageNumber) {
            previousRssi.add(rssi);
            if (Date.now() - timestampHashMap.get(senderId) < config.RSSIDataIntervalMax) {
                timestampHashMap.set(senderId, Date.now());
                return;
            }
        }
    } else {
        var previousRssi = new List();
        previousRssi.add(rssi);
        previousRssiHashMap.set(senderId, previousRssi);
        timestampHashMap.set(senderId, Date.now());
        timestampLastSentHashMap.set(senderId, Date.now());
        return;
    }
    var rssiVal = 0;
    //sort and average of mid values
    var previousRssi = previousRssiHashMap.get(senderId);
    previousRssi.sort();
    //console.log("previousRssi ", previousRssi.toArray());
    //console.log("rssi timestampHashMap ", timestampHashMap.toArray());
    var length = previousRssi.length;
    //console.log('length ' + length);
    if (length >= averageNumber) {
        for (i = 0; i < (length - 2); i++) {
            if(i<2) {
                previousRssi.shift();
            } else {
                rssiVal += previousRssi.shift();
            }
        }
        rssi = rssiVal / (length - 4);
        //console.log("1 rssiVal " + rssiVal + "rssi " + rssi);
    } else if (length >= averageNumber/2) {
        for (i = 0; i < (length - 1); i++) {
            if(i<1) {
                previousRssi.shift();
            } else {
                rssiVal += previousRssi.shift();
            }
        }
        rssi = rssiVal / (length - 2);
        //console.log("2 rssiVal " + rssiVal + "rssi " + rssi);
    } else {
        for (i = 0; i < length; i++) {
            rssiVal += previousRssi.shift();
        }
        rssi = rssiVal / length;
        //console.log("3 rssiVal " + rssiVal + "rssi " + rssi);
    }
    //console.log("averageRssi ", rssi);
    // Moving Average
    movingAverage(senderId, rssi, function(movingAvg){
        rssi = movingAvg;
        previousRssiHashMap.get(senderId).clear();
        previousRssiHashMap.get(senderId).add(rssi);

        if (timestampLastSentHashMap.has(senderId) && Date.now() - timestampLastSentHashMap.get(senderId) >= config.RSSIDataIntervalMin) {
            //send message
            console.log("movingAverage rssi for " + senderId + " is " + rssi);
            sendRSSI(sensorDetails, rssi);
        }
    });

            
};

function movingAverage(id, value, callback) {
    var average = 0;
    if (!movingAgerages) {
        movingAgerages = new FastMap();
        average = value;
    } else if (movingAgerages.has(id)) {
        average = movingAgerages.get(id);
    } else {
        average = value;
    }
    average = (average + value)/2.0;
    movingAgerages.set(id, average);
    callback(average);
}

function sendRSSI(SensorDetails, rssi) {
    //console.log("send RSSI");
	try {
        var json_data = {SensorKey:SensorDetails.SensorKey,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
            AssetBarcode:SensorDetails.AssetBarcode,RSSI:rssi,GatewayKey:config.MAC,Action:"IndoorPositioning"};
		cloudAdaptor(dataWrapper(json_data)); // pushing the data to cloud
	} catch (error) {
	    console.log(error);
	}
}

module.exports = XYBeacon;