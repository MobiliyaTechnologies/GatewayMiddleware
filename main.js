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
var whitelistAddressAll = [];
var whitelistContentAll = [];
var UpdateIP = require('./PluginGateway/Cloud/UpdateIP');
var GetWhiteList = require('./PluginGateway/Cloud/GetWhiteList');
const CompatibleSensors = [];
var DiscoveredPeripheral = [];
var allowDuplicates = false;
var jsonfile = require('jsonfile')
var sensorListFile = 'sensorlist.json';
var bus = require('./eventbus');
var HandleQueueInterval;
var List = require("collections/list");
var PeripheralList = new List([]);
var ConnectedPeripheralList = new List([]);
var capabilitiesFile = 'capabilities.json';
var Capabilities;
var SimultaneousBLEConnections = config.SimultaneousBLEConnections;
var BLEConnectionDuration = config.BLEConnectionDuration;

//Create an event handler:
var myUpdateEventHandler = function () {
	  updateSensorList();
}

function updateSensorList() {
	console.log('Update sensor list!');
	jsonfile.readFile(sensorListFile, function(err, obj) {
		if (err) {
		 console.log("Unabel to read sensorListFile !!");
		 console.log(err);
		  return;
		  } 
		  console.log("Updating list !!");	
		  //console.log(Object.keys(obj));
		  //console.log(obj);
		  cb(Object.keys(obj), obj);
	});
}

function getSensorUnit() {
	console.log('getSensorUnit');	
	jsonfile.readFile(capabilitiesFile, function(err, obj) {
		if (err) {
		 console.log("Unabel to read capabilitiesFile !!");
		 console.log(err);
		} else {
			console.log("getSensorUnit capabilities");
			Capabilities = obj;	
			console.log(JSON.stringify(Capabilities));
		}
	});
}

var sensorConnectedHandler = function (peripheralId) {
	console.log("sensorConnectedHandler");
	var found = false;
	ConnectedPeripheralList.forEach(function(element, indx){
		if(element == peripheralId) {
			found = true;
			return;
		}
	}); 
	if (!found) {
		//Add to list
		ConnectedPeripheralList.push(peripheralId);
	}
	ConnectedPeripheralList.forEach(function(element, indx){
		console.log("sensorConnectedHandler connectedPeripheral ", element); 
	}); 
}

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
}

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
getSensorUnit();

//Assign the event handler to an event:
bus.on('updatelist', myUpdateEventHandler);
bus.on('connected', sensorConnectedHandler);
bus.on('disconnected', sensorDisconnectedHandler);

//function which retireves the whitelist address from the api and saves to file "whitelist.json", and updates the global variable "whitelistAddressAll,whitelistContentAll"
//cb is the callback function after the getwhitelist for updating the global variables
function cb(whitelistaddresses,whitelistContent){
	console.log("Following whitelisted addresses found :",whitelistaddresses);
	whitelistAddressAll = whitelistaddresses;
	whitelistContentAll = whitelistContent;
}

//BLE APP is the main app which start the BLE thread
function BLEApp (){
	/*
	noble.on('stateChange', function(state) {
		if (state === 'poweredOn') {
		console.log("Adaptor State Changed to :", state);
		//noble.startScanning(allowDuplicates);
		setTimeout( function() { noble.startScanning()},2000);
				console.log("started scanning for ble sevices with following whitelisted address :",whitelistAddressAll);
		} else {
			noble.stopScanning();
		}
		
	});
	*/
	
	//start scanning for ble services
	try {
		noble.startScanning(null,allowDuplicates);
	} catch(error) {
		console.log("Error in start Scanning");
		console.log(error);
		return;
	}
	console.log("ScanningStarted");
	bus.emit('log',"ScanningStarted");
	//callback when BLE scan discovers a new ble device, return a peripheral object
	noble.on('discover',function(peripheral) { 
		//console.log(peripheral)
		// search for the local devices at, if it is a whitelisted address, connect to its specific sensor library
		var index = whitelistAddressAll.indexOf(peripheral.id);
		if (index == -1){
			// condition when the device found is not in whitelist
			console.log('Found device with local name which is not a whitelist : '+ peripheral.id);
			//bus.emit('log','Found device with local name which is not a whitelist : '+ peripheral.id);
			//create a array for the devices which are discovered now, but may have been whitelisted in runtime later
			// NOTE : It may create large memory if so many decvices are discovered over time, should apply filter in the device name
			if (CompatibleSensors.indexOf(peripheral.advertisement.localName) !== -1){
				DiscoveredPeripheral.push(peripheral);
				//console.log(DiscoveredPeripheral);
			}
		}else{
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
					console.log("List PUSH: ", peripheral.id)
					PeripheralList.push(peripheral);
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
		
		setTimeout(function(){
			noble.startScanning(null,allowDuplicates);
			console.log("ScanningStarted");
			bus.emit('log',"ScanningStarted");
		}, config.BLEReconnectionInterval);
	});

};

function HandleQueue() {
	console.log('HandleQueue ',  new Date());
	for(var i=0; i<SimultaneousBLEConnections; i++) {
		var peripheral = PeripheralList.shift();
		if(peripheral == undefined) {
			return;
		}
		if(!isPeripheralConnected(peripheral.id)) {
			console.log("connectPeripheral ", peripheral.id);
			connectPeripheral(peripheral); 
		} else {
			console.log("Peripheral Already Connected ", peripheral.id);
		}
	}
}

function connectPeripheral(peripheral) {
	if	(peripheral != undefined) {
			console.log("List POP: ", peripheral.id);
				//bus.emit('log',"Whitelisted device found: " + peripheral.id);
				var SensorId = peripheral.id.toLowerCase();
				if(whitelistContentAll[SensorId] == undefined) {
					return;
				}
				if (whitelistContentAll[SensorId].SensorType == "SensorTag2650"){
					var ST_2650_DS = new SensorDataStructure();
					//var ST_2650_CloudAdaptor = new CloudAdaptor();
					var ST_2650_Handle = new SensorTag2650();
					ST_2650_Handle.SensorTagHandle2650(peripheral,CloudAdapterInstance.AzureHandle,ST_2650_DS.JSON_data,whitelistContentAll[SensorId],
													   Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
				}else if (whitelistContentAll[SensorId].SensorType == "SensorTag1350"){
					var ST1350_DS = new SensorDataStructure();
					//var ST1350_CloudAdaptor = new CloudAdaptor();
					var ST1350_Handle = new SensorTag1350();
					ST1350_Handle.SensorTagHandle1350(peripheral,CloudAdapterInstance.AzureHandle,ST1350_DS.JSON_data,whitelistContentAll[SensorId],
													  Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
				}else if (whitelistContentAll[SensorId].SensorType == "Bosch-XDK"){
					var XDK_DS = new SensorDataStructure();
					//var XDK_CloudAdaptor = new CloudAdaptor();
					var XDK_Handle = new XDK();
					XDK_Handle.XDKHandle(peripheral,CloudAdapterInstance.AzureHandle,XDK_DS.JSON_data,whitelistContentAll[SensorId],
										 Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
				}else if (whitelistContentAll[SensorId].SensorType == "ThunderBoard-React"){
				//if (peripheral.id == "000b571c53ae"){ // for testing the sensor locally without whitelisting
					var ThunderboardReact_DS = new SensorDataStructure();
					//var ThunderboardReact_CloudAdaptor = new CloudAdaptor();
					var ThunderboardReact_Handle = new ThunderboardReact();
					ThunderboardReact_Handle.ThunderboardReactHandle(peripheral,CloudAdapterInstance.AzureHandle,ThunderboardReact_DS.JSON_data,whitelistContentAll[SensorId],
																	 Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
				}else if (whitelistContentAll[SensorId].SensorType == "ThunderBoard-Sense"){
					var ThunderboardSense_DS = new SensorDataStructure();
					//var ThunderboardSense_CloudAdaptor = new CloudAdaptor();
					var ThunderboardSense_Handle = new ThunderboardSense();
					ThunderboardSense_Handle.ThunderboardSenseHandle(peripheral,CloudAdapterInstance.AzureHandle,ThunderboardSense_DS.JSON_data,whitelistContentAll[SensorId],
																	 Capabilities,BLEConnectionDuration,config.ContinuousBLEConnection);
				}else{
					//console.log(peripheral);
					// logs the issue when the particular BLE device is whitelisted but its corresponding BLE library is not found
					console.log('No compatible library for this sensor: ', peripheral.advertisement.localName,peripheral.id);
					bus.emit('log','No compatible library for this sensor: ' + peripheral.id);
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

// call the particular cloud init process
CloudAdapterInstance.AzureInit(function (){
	// start the local protocol app
	CloudLed("1");//Power on the cloud led as the cloud init is now successful
	BLEApp();

});

if (config.ContinuousBLEConnection === 0) {
	HandleQueueInterval = setInterval(HandleQueue,config.BLEReconnectionInterval);
}