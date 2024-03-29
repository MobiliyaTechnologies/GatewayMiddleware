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
 * @summary: Discover and connect bluetooth devics
 *******************************************************************************/

// main contanins the control flow only, (which inculdes whitelisting logic, cloud adaptor initialisation, and wireless protocol initialisation(BLE,ZIGBEE))
//      rest all device specific libraries are plugin for more information go to specific imports
var noble = require('noble');
var config = require('./config');
//var localServer = require('./LocalServer');
var SensorTag2650 = require('./PluginGateway/Bluetooth/SensorTag2650');
var SensorTag1350 = require('./PluginGateway/Bluetooth/SensorTag1350');
var ThunderboardReact = require('./PluginGateway/Bluetooth/ThunderReact');
var ThunderboardSense = require('./PluginGateway/Bluetooth/ThunderSense');
var XDK = require('./PluginGateway/Bluetooth/XDK');
var Geolocation = require('./PluginGateway/Bluetooth/Geolocation');
var CloudAdaptor = require('./PluginGateway/Cloud/AzureAdaptor');
var SensorDataStructure = require('./PluginGateway/SensorDataStructure/Json');
var CloudLed = require('./PluginGateway/Cloud/CloudLed');
var whitelistAddressAll;
var whitelistContentAll;
var UpdateIP = require('./PluginGateway/Cloud/UpdateIP');
var GetWhiteList = require('./PluginGateway/Cloud/GetWhiteList');
const CompatibleSensors = [];
var DiscoveredPeripheral = [];
var allowDuplicates = false;
var fs = require('fs');
var jsonfile = require('jsonfile')
var sensorListFile = 'sensorlist.json';
var sensorTypesFile = 'sensorTypes.json';
var bus = require('./eventbus');
var HandleQueueInterval;
var List = require("collections/list");
var PeripheralList = new List([]);
var ConnectedPeripheralList = new List([]);
var ConnectedPeripheralDetails = [];
var capabilitiesFile = 'capabilities.json';
var Capabilities;
var SensorCapabilities;
var SimultaneousBLEConnections = config.SimultaneousBLEConnections;
var BLEConnectionDuration = config.BLEConnectionDuration;
var BLEReconnectionInterval = config.BLEReconnectionInterval;
var disconnectHandler;
var disconnectHandlerCalled = 0;
var IsBluetoothPoweredOn = true;
var IsAzureClientConnected = false;
var isScanningStarted = false;
var startedBLEApp = 0;
var startScanningIntervalFunction;
/*
let appInsights = require('applicationinsights');
let client = appInsights.client;
*/
//Create an event handler:
var myUpdateEventHandler = function () {
	  updateSensorList();
}

var updateSensorTypesHandler = function () {
	  updateSensorTypes();
}

var azureClientDisconnected = function () {
	IsAzureClientConnected = false;
	console.log("Stop scanning and try to reconnect azure client");
	stopScanning();
	setTimeout(startAzureClient, 60000);
	clearTimeout(startScanningIntervalFunction);
}

var stopGateway = function () {
	IsAzureClientConnected = false;
	console.log("Stop Gateway");
	stopScanning();
	setTimeout(startAzureClient, 60000);
	clearTimeout(startScanningIntervalFunction);

	CloudAdapterInstance.AzureStop(function (){
		console.log("Azure client stopped");
		bus.emit('log', 'Azure client stopped');
	});
}

var startAzureClient = function initAzureClinet() {
	// call the particular cloud init process
	CloudAdapterInstance.AzureInit(function (){
		IsAzureClientConnected = true;
		// start the local protocol app
		CloudLed("1");//Power on the cloud led as the cloud init is now successful
		//BLEApp();
		if(whitelistAddressAll != undefined && whitelistAddressAll != null && whitelistAddressAll.length > 0) {
			startScanning();
		}
	});
}

function updateSensorList() {
	console.log('Update sensor list!');
	if (fs.existsSync(sensorListFile)) {
		var fileData = jsonfile.readFileSync(sensorListFile, "utf8");
		if (fileData == undefined || fileData == null) {
			console.log("Unabel to read sensorListFile !!");	
			console.log("Whitelisted sensor list not available");	
			bus.emit('log', "Whitelisted sensor list not available. If sensors exist, click submit again to sync.");
			//console.log(err);
			if(isScanningStarted == true) {
				stopScanning();	
			}
		} else { 
			console.log("Updating list !!");	
			bus.emit('log', "Whitelisted sensor list Updated");
			//console.log(Object.keys(obj));
			//console.log(obj);
			//cb(Object.keys(fileData), fileData);
			whitelistAddressAll = Object.keys(fileData);
			whitelistContentAll = fileData;
			console.log("Following whitelisted addresses found :",whitelistAddressAll);
			if(whitelistAddressAll != undefined && whitelistAddressAll != null && whitelistAddressAll.length > 0) {
				//start if whitelisted sensor available
				if(isScanningStarted == false) {
					console.log("start scanning G");
					startScanning();
				} else {
					//scanning will restart after stopping
					console.log("restart scanning G");
					stopScanning();
					startScanning();
				}
			} else if(whitelistAddressAll == undefined || whitelistAddressAll == null || whitelistAddressAll.length <= 0){
				//stop scanning if not whitelisted sensor available
				if(isScanningStarted == true){
					console.log("stop scanning G");
					stopScanning();
				}
				console.log("Whitelisted sensor list not available");	
				bus.emit('log', "Whitelisted sensor list not available. If sensors exist, click submit again to sync.");
			}
		}
	} else {
		console.log("Whitelisted sensor lint not available");
		bus.emit('log', "Whitelisted sensor list not available. If sensors exist, click submit again to sync.");
		if(isScanningStarted == true) {
			stopScanning();	
		}
			
	}
}

function updateSensorTypes() {
	console.log('Update sensor types!');
	if (fs.existsSync(sensorTypesFile)) {
		var fileData = jsonfile.readFileSync(sensorTypesFile, "utf8");
		if (fileData == undefined || fileData == null) {
				 console.log("Unabel to read sensorTypesFile !!");
				 //console.log(err);
				 return;
		} else { 
			console.log("Updating sensor types !!");	
			SensorCapabilities = fileData;
			//console.log(JSON.stringify(SensorCapabilities));
		}
	}
}

function getSensorUnit() {
	console.log('getSensorUnit');
	if (fs.existsSync(capabilitiesFile)) {
		var fileData = jsonfile.readFileSync(capabilitiesFile, "utf8");
		if (fileData == undefined || fileData == null) {
			 console.log("Unabel to read capabilitiesFile !!");
			 //console.log(err);
		} else {
				console.log("getSensorUnit capabilities found");
				Capabilities = fileData;	
		}
	}
}

var sensorConnectedHandler = function (peripheral) {
	console.log("sensorConnectedHandler");
	var found = false;
    for (var i = 0;i < ConnectedPeripheralDetails.length;i++) {
		if(ConnectedPeripheralDetails[i].id == peripheral.id) {
			found = true;
			return;
		}
	}
    if (!found) {
        ConnectedPeripheralDetails.push(peripheral);
    }
}

var peripheralDisconnectHandler = function() {
    for (var i = 0;i < ConnectedPeripheralDetails.length;i++) {
        var peripheral = ConnectedPeripheralDetails[i];
        console.log(peripheral.uuid + " Disconnect handler MAIN");
        ConnectedPeripheralDetails[i].disconnect(function(error) {
    	    if(error) {
	    	    console.log(this.uuid + " Disconnect error MAIN");
		        console.log(error);
				//client.trackException(error);
		    } else {
			    console.log(this.uuid + " Disconnect handler MAIN");
		    }
			/*
			console.log("Emit Events");
			bus.emit('disconnected', peripheral.uuid);
			bus.emit('sensor_group_disconnected',GroupId);
			bus.emit('log', 'Disconnected to SensorTag2650: '	+ peripheral.uuid);
			*/
        });
    }

    //ConnectedPeripheralDetails = [];
    clearTimeout(disconnectHandler);
    disconnectHandlerCalled = 0;
};

/*
var sensorDisconnectedHandler = function (peripheralId) {
	console.log("sensorDisconnectedHandler");
	 var found = false;
	ConnectedPeripheralList.forEach(function(element, indx){
		if(element == peripheralId) {
			found = true;
			return;
		}
	}); 
	if (found) {
		//Remove from list
		ConnectedPeripheralList.delete(peripheralId);
	}
	ConnectedPeripheralList.forEach(function(element, indx){
		console.log("sensorDisconnectedHandler connectedPeripheral ", element); 
	}); 
}*/

function isPeripheralConnected(peripheralId) {
	var found = false;
	ConnectedPeripheralList.forEach(function(element, indx){
		if(element == peripheralId) {
			found = true;
			return;
		}
	}); 
	return found;
}

updateSensorList();
updateSensorTypes();
getSensorUnit();

//Assign the event handler to an event:
bus.on('updatelist', myUpdateEventHandler);
bus.on('updateSensorTypes', updateSensorTypesHandler);
bus.on('connected', sensorConnectedHandler);
bus.on('azureClientDisconnected', azureClientDisconnected);
bus.on('stopGateway', stopGateway);

function stopScanning() {
	isScanningStarted = false;
	noble.stopScanning();	//Win	
	console.log("onStateChange clear HandleQueueInterval");
	bus.emit('all_sensor_group_disconnected');
	clearInterval(HandleQueueInterval);
}

function startScanning() {
	console.log("startScanning");
	//start scanning for ble services
	if(isScanningStarted == true) {
		console.log("already in scan mode, return !");
		//return;
	}
	try {
		console.log("scan....");
		isScanningStarted = true;
		noble.on('stateChange', function(state) {
			console.log("onStateChange to ", state);
			bus.emit('log',"Bluetooth state changed to " + state);
			if (state === 'poweredOn') {
				IsBluetoothPoweredOn = true;
				//noble.startScanning(allowDuplicates);
				if(IsAzureClientConnected ) {
					setTimeout( function() { 
						if (state === 'poweredOn' && state !== 'unauthorized') {
							console.log("onStateChange startScanning");
							bus.emit('log',"Start Scanning on Bluetooth ON");
							try {
								noble.startScanning(null,allowDuplicates);
							} catch (error) {
								console.log("Unable to start scanning for bluetooth devices. Either bluetooth is not powered on or run as root.");
								bus.emit('log',"Unable to start scanning for bluetooth devices. Either bluetooth is not powered on or run as root.");
								console.log(error);
							}
						} else {
							IsBluetoothPoweredOn = false;
							console.log("bluetooth state != poweredOn");
						}
						//BLEApp();
					}, 2000);
					console.log("onStateChange started scanning for BLE Devices");
				
					if (config.ContinuousBLEConnection === 0) {
						console.log("onStateChange HandleQueueInterval");
						HandleQueueInterval = setInterval(HandleQueue, BLEReconnectionInterval);
					}
				}
			} else {
				IsBluetoothPoweredOn = false;
				//console.log("onStateChange stopScanning");
				stopScanning();
			
			}	
			
		});
		if (startedBLEApp === 0) {
	            BLEApp();
		    startedBLEApp = 1;
		}
		
		console.log("startScanning - started scanning for BLE Devices");
		noble.startScanning(null,allowDuplicates);

		if (config.ContinuousBLEConnection === 0) {
			console.log("startScanning - HandleQueueInterval");
			HandleQueueInterval = setInterval(HandleQueue, BLEReconnectionInterval);
		}
	} catch(error) {
		console.log("Please enable bluetooth and Try Again !");
		bus.emit('log',"Please enable bluetooth and Try Again !");
		console.log("Error in start Scanning");
		console.log(error);
		//client.trackException(error);
		IsBluetoothPoweredOn = false;
		console.log("BLEApp clear HandleQueueInterval");
		clearInterval(HandleQueueInterval);
		return;
	}
}

//BLE APP is the main app which start the BLE thread
function BLEApp () {
	console.log("BLEApp ScanningStarted");
	bus.emit('log',"ScanningStarted");
	//callback when BLE scan discovers a new ble device, return a peripheral object
	noble.on('discover',function(peripheral) { 
		//console.log(peripheral)
		// search for the local devices at, if it is a whitelisted address, connect to its specific sensor library
		var index = whitelistAddressAll.indexOf(peripheral.id);
		if (index == -1) {
			// condition when the device found is not in whitelist
			console.log('Found device with local name which is not a whitelist : '+ peripheral.id);
			//bus.emit('log','Found device with local name which is not a whitelist : '+ peripheral.id);
			//create a array for the devices which are discovered now, but may have been whitelisted in runtime later
			// NOTE : It may create large memory if so many decvices are discovered over time, should apply filter in the device name
			if (CompatibleSensors.indexOf(peripheral.advertisement.localName) !== -1){
				DiscoveredPeripheral.push(peripheral);
				//console.log(DiscoveredPeripheral);
			}
		} else {
			// check for particular case of the whitelist address
			console.log(peripheral.id);
			if (config.ContinuousBLEConnection === 0) {
				var found = false;
				PeripheralList.forEach(function(element, indx){
						//console.log(JSON.stringify(element));
						//console.log("List items: ", element.id);
						if(element.id == peripheral.id) {
							found = true;
							return;
						}
				});
				if (!found) {
					//Add to list
                    var justConnected = 0;
					console.log("List PUSH: ", peripheral.id);
                    for (var i = 0;i < ConnectedPeripheralDetails.length;i++) {
                        if(ConnectedPeripheralDetails[i] && (ConnectedPeripheralDetails[i].id == peripheral.id)) {
                            justConnected = 1;
                            break;
                        }
                    }
                    console.log("Adding " + peripheral.id);
                    if (justConnected || (PeripheralList.length == 0)) {
    					PeripheralList.push(peripheral);
                    } else {
    					PeripheralList.unshift(peripheral);
                    }
					/*PeripheralList.forEach(function(element, indx){
						//console.log(JSON.stringify(element));
						console.log("List items: ", element.id);
					});*/ 
				} else {
					//console.log("List PUSH")
				}
			} else {
				connectPeripheral(peripheral);
			}
		}
	});
	
	// check for a message, removed beacuse already implemented in noble internally
	/*
	noble.on('warning',function(message){
		console.log(message);
	});
	*/

	// if a scan stop happens internally in a BLE stack for unknown reasons, start scanning again after a timeout
	// NOTE: not to be used with state change listener
	noble.on('scanStop', function(){
		console.log("ScanningStopped");
		bus.emit('log',"ScanningStopped");
		/*var t = 2000;
		if(config.BLEReconnectionInterval - 3000 > 2000) {
			t = config.BLEReconnectionInterval - 3000;
		}*/
		//clearPeripheralList
		PeripheralList.clear();
		
        console.log("Scanning to start soon in " + BLEReconnectionInterval + " ms");
		if(IsBluetoothPoweredOn && IsAzureClientConnected) {
			clearTimeout(startScanningIntervalFunction);
			if(whitelistAddressAll!=undefined && whitelistAddressAll!=null && whitelistAddressAll.length>0) {
				startScanningIntervalFunction = setTimeout(function() {
					if(IsBluetoothPoweredOn) {
						noble.startScanning(null,allowDuplicates);
						console.log("ScanningStopped => ScanningStarted");
						bus.emit('log',"ScanningStarted");
					}
				}, BLEReconnectionInterval);
				//}, 1000);
			}
		}
        if (config.BLEConnectionDuration != BLEConnectionDuration) {
            BLEConnectionDuration = config.BLEConnectionDuration;
            BLEReconnectionInterval = config.BLEReconnectionInterval;
        }
	});

};

function HandleQueue() {
    var setDisconnectHandler = 0;
    ConnectedPeripheralDetails = [];
    if (disconnectHandlerCalled) {
        return;
    }
	console.log('HandleQueue ',  new Date());
	for(var i = 0;i < SimultaneousBLEConnections;i++) {
		var peripheral = PeripheralList.shift();
		if(peripheral == undefined) {
			break;
		}
		if(!isPeripheralConnected(peripheral.id)) {
			console.log("connectPeripheral ", peripheral.id);
			connectPeripheral(peripheral);
            setDisconnectHandler = 1;
		} else {
			console.log("Peripheral Already Connected ", peripheral.id);
		}
	}
	if((config.ContinuousBLEConnection === 0) && (setDisconnectHandler === 1)) {
        disconnectHandler = setTimeout(peripheralDisconnectHandler, BLEConnectionDuration, ConnectedPeripheralDetails);
        disconnectHandlerCalled = 1;
    }
}

function connectPeripheral(peripheral) {
	console.log("connectPeripheral");
	noble.stopScanning();	//Win
	if	(peripheral != undefined) {
			console.log("List POP: ", peripheral.id);
				//bus.emit('log',"Whitelisted device found: " + peripheral.id);
				var SensorId = peripheral.id.toLowerCase();
				if(whitelistContentAll[SensorId] == undefined) {
					return;
				} else {
					console.log(SensorId  + " is whitelisted");
					if (whitelistContentAll[SensorId].SensorType == "SensorTag2650"){
						console.log(SensorId  + " is SensorTag2650");
						var ST_2650_DS = new SensorDataStructure();
						//var ST_2650_CloudAdaptor = new CloudAdaptor();
						var ST_2650_Handle = new SensorTag2650();
						var thisSensorCapabilities = [];
						if(SensorCapabilities != undefined) {
							if(SensorCapabilities.hasOwnProperty(whitelistContentAll[SensorId].SensorType)) {
								thisSensorCapabilities = SensorCapabilities[whitelistContentAll[SensorId].SensorType].SensorCapabilities;
								//console.log("thisSensorCapabilities: " + JSON.stringify(thisSensorCapabilities));
							}
						}
						ST_2650_Handle.SensorTagHandle2650(peripheral,CloudAdapterInstance.AzureHandle,ST_2650_DS.JSON_data,whitelistContentAll[SensorId],
														   thisSensorCapabilities,Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
					} else if (whitelistContentAll[SensorId].SensorType == "SensorTag1350"){
						console.log(SensorId  + " is SensorTag1350");
						var ST1350_DS = new SensorDataStructure();
						//var ST1350_CloudAdaptor = new CloudAdaptor();
						var ST1350_Handle = new SensorTag1350();
						var thisSensorCapabilities = [];
						if(SensorCapabilities != undefined) {
							if(SensorCapabilities.hasOwnProperty(whitelistContentAll[SensorId].SensorType)) {
								thisSensorCapabilities = SensorCapabilities[whitelistContentAll[SensorId].SensorType].SensorCapabilities;
							}
						}
						ST1350_Handle.SensorTagHandle1350(peripheral,CloudAdapterInstance.AzureHandle,ST1350_DS.JSON_data,whitelistContentAll[SensorId],
														  thisSensorCapabilities,Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
					} else if (whitelistContentAll[SensorId].SensorType == "Bosch-XDK"){
						console.log(SensorId  + " is Bosch-XDK");
						var XDK_DS = new SensorDataStructure();
						//var XDK_CloudAdaptor = new CloudAdaptor();
						var XDK_Handle = new XDK();
						var thisSensorCapabilities = [];
						if(SensorCapabilities != undefined) {
							if(SensorCapabilities.hasOwnProperty(whitelistContentAll[SensorId].SensorType)) {
								thisSensorCapabilities = SensorCapabilities[whitelistContentAll[SensorId].SensorType].SensorCapabilities;
							}
						}
						XDK_Handle.XDKHandle(peripheral,CloudAdapterInstance.AzureHandle,XDK_DS.JSON_data,whitelistContentAll[SensorId],
											 thisSensorCapabilities,Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
					} else if (whitelistContentAll[SensorId].SensorType == "ThunderBoard-React"){
						console.log(SensorId  + " is ThunderBoard-React");
					//if (peripheral.id == "000b571c53ae"){ // for testing the sensor locally without whitelisting
						var ThunderboardReact_DS = new SensorDataStructure();
						//var ThunderboardReact_CloudAdaptor = new CloudAdaptor();
						var ThunderboardReact_Handle = new ThunderboardReact();
						var thisSensorCapabilities = [];
						if(SensorCapabilities != undefined) {
							if(SensorCapabilities.hasOwnProperty(whitelistContentAll[SensorId].SensorType)) {
								thisSensorCapabilities = SensorCapabilities[whitelistContentAll[SensorId].SensorType].SensorCapabilities;
							}
						}
						ThunderboardReact_Handle.ThunderboardReactHandle(peripheral,CloudAdapterInstance.AzureHandle,ThunderboardReact_DS.JSON_data,whitelistContentAll[SensorId],
																		thisSensorCapabilities,Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
					} else if (whitelistContentAll[SensorId].SensorType == "ThunderBoard-Sense"){
						console.log(SensorId  + " is ThunderBoard-Sense");
						var ThunderboardSense_DS = new SensorDataStructure();
						//var ThunderboardSense_CloudAdaptor = new CloudAdaptor();
						var ThunderboardSense_Handle = new ThunderboardSense();
						var thisSensorCapabilities = [];
						if(SensorCapabilities != undefined) {
							if(SensorCapabilities.hasOwnProperty(whitelistContentAll[SensorId].SensorType)) {
								thisSensorCapabilities = SensorCapabilities[whitelistContentAll[SensorId].SensorType].SensorCapabilities;
							}
						}
						ThunderboardSense_Handle.ThunderboardSenseHandle(peripheral,CloudAdapterInstance.AzureHandle,ThunderboardSense_DS.JSON_data,whitelistContentAll[SensorId],
																		 thisSensorCapabilities,Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
					} else{
						//console.log(peripheral);
						// logs the issue when the particular BLE device is whitelisted but its corresponding BLE library is not found
						console.log('No compatible library for this sensor: ', peripheral.advertisement.localName,peripheral.id);
						bus.emit('log','No compatible library for this sensor: ' + peripheral.id);
					}
				}
		} else {
			console.log("peripheral undifined");
		}
}

//Switch off the Cloud Led as the cloud is yet to start
CloudLed("0");
//call the Update IP on cloud
//UpdateIP();
//update the IP every 3minutes
//setInterval(function(){UpdateIP()},120000);
// call the get whitelist
//GetWhiteList(cb);
//require('./c2d_message_receiver');
// call the get whitelist regularly
//setInterval(function(){GetWhiteList(cb)},30000);

// constructor for cloud init
var CloudAdapterInstance = new CloudAdaptor();


//start grolocation plugin
var Geolocation_DS = new SensorDataStructure();
var Geolocation_CloudAdaptor = new CloudAdaptor();
var Geolocation_Handle = new Geolocation();
Geolocation_Handle.GeolocationHandler(Geolocation_CloudAdaptor.AzureHandle,Geolocation_DS.JSON_data,BLEConnectionDuration);

fs.readFile('./connectionTimeout.txt', 'utf8', function (err,data) {
    if (!err) {
        BLEConnectionDuration = data;
        config.BLEConnectionDuration = BLEConnectionDuration;
        config.BLEReconnectionInterval = config.BLEConnectionDuration + 500;
    }
});

startAzureClient();

