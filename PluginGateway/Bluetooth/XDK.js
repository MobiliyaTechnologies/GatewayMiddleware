var bus = require('../../eventbus');
function XDK () { };//class for XDK
var disconnectHandler;
var isDisconnectHandlerCalled = false;

let appInsights = require('applicationinsights');
let appInsightsClient = appInsights.client;

XDKDisconnectHandler = function(peripheral,GroupId) {
	console.log("Called Bosch-XDK DisconnectHandler" );
	isDisconnectHandlerCalled = true;
	peripheral.disconnect(function(error){
		if (error) {
			console.log(peripheral.uuid + " Disconnect error");
			console.log(error);
			appInsightsClient.trackException(error);
		}
	});
};

XDK.prototype.XDKHandle = function (peripheral,CloudAdaptor,DataWrapper,SensorDetails,SensorCapabilities,Capabilities,BLEConnectionDuration,ContinuousBLEConnection) {// XDK handle
	var disconnectEventsSent = false;

	if(ContinuousBLEConnection===0) {
		console.log("SetTiomout  for DisconnectHandler");
		isDisconnectHandlerCalled = false;
		disconnectHandler = setTimeout(XDKDisconnectHandler,BLEConnectionDuration, peripheral,SensorDetails.GroupId);
	}
	if(!isDisconnectHandlerCalled) {
		peripheral.connect(function(error) {
			if(error) {
				console.log("Error in connection with peripheral (Bosch-XDK): " + peripheral);
				console.log(error);
				appInsightsClient.trackException(error);
				return;
			}
			if (isDisconnectHandlerCalled) {
				console.log("isDisconnectHandlerCalled: ", isDisconnectHandlerCalled);
				peripheral.disconnect(function(error){
					if (error) {
						console.log(peripheral.uuid + " Disconnect error");
						console.log(error);
						appInsightsClient.trackException(error);
					}
				});
				return;
			}
			bus.emit('connected', peripheral);
			bus.emit('sensor_group_connected',SensorDetails.GroupId);
			console.log('connected to peripheral (Bosch-XDK): '	+ peripheral.uuid);
			bus.emit('log', 'connected to Bosch-XDK: '	+ peripheral.uuid);
			process.on('SIGINT', function() {
				var i_should_exit = true;
				console.log("Caught interrupt signal");
				if(!disconnectEventsSent) {
					console.log("Emit Events");
					bus.emit('disconnected', peripheral.uuid);
					bus.emit('sensor_group_disconnected',SensorDetails.GroupId);
					bus.emit('log', 'Disconnected to Bosch-XDK: '	+ peripheral.uuid);
					disconnectEventsSent = true;
				}
				peripheral.disconnect(function(error){
					if(error) {
						appInsightsClient.trackException(error);
						console.log(peripheral.uuid + " Disconnect error", error);
					} else {
						console.log(peripheral.uuid + " Disconnected");
					}
					if(ContinuousBLEConnection===0){
						clearTimeout(disconnectHandler);
					}
				});
				if(i_should_exit) {
						process.exit();
				}
			});

			peripheral.updateRssi(function(error, rssi){
				console.log("update RSSI");
				if(error) {
					appInsightsClient.trackException(error);
					console.log("updateRSSI error");
					console.log(error);
				}
			});

			peripheral.once('rssiUpdate', function(rssi) {
				console.log("once RSSIUpdate");
				if(rssi == undefined) {
					return;
				}
				console.log("RSSI  SENT : ", rssi );
				var json_data = {SensorKey:SensorDetails.SensorKey,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
														AssetBarcode:SensorDetails.AssetBarcode,RSSI:rssi};
				CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
			});
			
			
			peripheral.discoverServices(null,function(error, services) {// service discovery
				if(error) {
					console.log('Error in discoverServices');
					console.log(error);
					appInsightsClient.trackException(error);
				} else {
					/*console.log('discovered the following services:');
					for ( var i in services) {
						console.log('  '+ i	+ ' uuid: '	+ services[i].uuid);
					}*/
				}
			});
			peripheral.once('servicesDiscover', function(services){//on service discovery
				var AccelerometerService = services[2];
				if (AccelerometerService == undefined) {
						return;
				}
				AccelerometerService.discoverCharacteristics(null,function(error,characteristics) {// characteristic discovery
					console.log('discovered the following characteristics:');
					for ( var i in characteristics) {
						console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
					}
				});
		
				AccelerometerService.once('characteristicsDiscover', function(characteristics){// on characteristic discover
					var startSamplingAccelerometerData = characteristics[0];
					var notifyServiceAccelerometerData = characteristics[1];
					if (notifyServiceAccelerometerData == undefined || startSamplingAccelerometerData == undefined) {
							return;
					}
					notifyServiceAccelerometerData.on('data', function(data,isNotification) {// notification events form acclerometer service
						var data = data.toString('utf-8');
						// The substituted value will be contained in the result variable
						var zValue = (data.split(' ')[2]).replace(/\0[\s\S]*$/g,'');// regular expression for handling the z value
						
						var capId = 0;
						for(var item in SensorCapabilities) {
							if(SensorCapabilities[item].Name == "Accelerometer") {
								capId = SensorCapabilities[item].Id;
							}
						}
						//GroupId:SensorDetails.GroupId,
						
						// formatting data in m/s square in SI units
						var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
										AssetBarcode:SensorDetails.AssetBarcode,x:(Math.floor(parseInt(data.split(' ')[0])/430)),y:(Math.floor(parseInt(data.split(' ')[1])/430)),z:(Math.floor(parseInt(zValue)/430))};

						// the value can be scaled as per the requirement by editing the above line 
						//var json_XYZ = {x:data.split(' ')[0],y:data.split(' ')[1],z:zValue}// formatting raw data 
						console.log("XDK Accelerometer Data-- data event> ",	data.toString('utf-8'));
						CloudAdaptor(DataWrapper(json_data));// pushing the data to cloud
						//console.log(json_data);
					});
					//Writing data to the characteristic to start accelerometer sampling
					var writeData = new Buffer("7374617274","hex");
					notifyServiceAccelerometerData.subscribe(function(error) {// enabling notifications for accelrometer service
						if(error) {
							appInsightsClient.trackException(error);
						}
						console.log('Subscription for notification enabled ',error);
						notifyServiceAccelerometerData.notify(true, function(){// starting notifications
							startSamplingAccelerometerData.write(new Buffer(writeData),false,function(error) { //writing data to start notifications
								if(error) {
									appInsightsClient.trackException(error);
								}
								console.log('starting Accelerometer Sampling',error);

							});
						});
					});
				});
			});
		});
	}
	
	peripheral.once('disconnect', function() {
		console.log("Once Disconnect time ", new Date() );
		if(!disconnectEventsSent) {
			console.log("Emit Events");
			bus.emit('disconnected', peripheral.uuid);
			bus.emit('sensor_group_disconnected',SensorDetails.GroupId);
			bus.emit('log', 'Disconnected to Bosch-XDK: ' + peripheral.uuid);
			disconnectEventsSent = true;
		}
		if(ContinuousBLEConnection===0){
			clearTimeout(disconnectHandler);
		}
	});
};
module.exports = XDK;
