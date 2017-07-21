var bus = require('../../eventbus');
function ThunderboardReact () { };//class for thunderboard react
var EnvironInterval;
var LightInterval;
var disconnectHandler;

function readEnvironment (CloudAdaptor,DataWrapper,Humidity,Temperature,UVIndex,SensorDetails,capIdHumidity,capIdTemperature,capIdUVIndex) {
	try {
		if (capIdHumidity > -1) {
			Humidity.read(function(err,data){
				// formatting data in RH in SI units
				var val = parseFloat(data.readUInt16LE().toString().slice(0,2)+"."+data.readUInt16LE().toString().slice(2,4));
				var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdHumidity,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
								 AssetBarcode:SensorDetails.AssetBarcode,Humidity:val};
				CloudAdaptor(DataWrapper(json_data));
			});
		}
		if(capIdTemperature > -1) {
			Temperature.read(function(err,data){
					// formatting data in degree celsius in SI units
				var val = parseFloat(data.readUInt16LE().toString().slice(0,2)+"."+data.readUInt16LE().toString().slice(2,4));
				var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdTemperature,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
								 AssetBarcode:SensorDetails.AssetBarcode,AmbientTemperature:val};
				CloudAdaptor(DataWrapper(json_data));
			});
		}
		if(capIdUVIndex > -1) {
			UVIndex.read(function(err,data){
				// formatting data in Scale (int) in SI units
				var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdUVIndex,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
								 AssetBarcode:SensorDetails.AssetBarcode,UVIndex:(data.readUInt8())};
				CloudAdaptor(DataWrapper(json_data));
			});
		}
	} catch (error) {
		console.log(error);
	}
};

function readAmbientLight(CloudAdaptor,DataWrapper,AmbientLight,SensorDetails,capIdAmbientLight){
	try {
		if(capIdAmbientLight > -1) {
			AmbientLight.read(function(err,data){
				// formatting data in Lux in SI units
				var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdAmbientLight,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
											 AssetBarcode:SensorDetails.AssetBarcode,Luxometer:(Math.floor(data.readUInt16LE()/10))};
				CloudAdaptor(DataWrapper(json_data));

			});
		}
	} catch (error) {
		console.log(error);
	}
};

ThunderboardReactDisconnectHandler = function(peripheral,GroupId) {
	peripheral.disconnect(function(error){
		if (error) {
			console.log(peripheral.uuid + " Disconnect error");
			console.log(error);
		} else {
			console.log(peripheral.uuid + " Disconnected");
		}
		
		bus.emit('sensor_group_disconnected',GroupId);
	});
};

ThunderboardReact.prototype.ThunderboardReactHandle= function (peripheral,CloudAdaptor,DataWrapper, SensorDetails,Capabilities,BLEConnectionDuration){
	
	disconnectHandler = setTimeout(ThunderboardReactDisconnectHandler,BLEConnectionDuration, peripheral,SensorDetails.GroupId);
	var AmbientTempUnit = "Celsius";
	if (Capabilities != undefined) {
		Capabilities.forEach(function(elem, index) {
			if (elem.Name == "AmbientTemperature") {
				AmbientTempUnit = elem.Unit;
			}	
		});
	}
	
	peripheral.connect(function(error) {
		if(error) {
			console.log("Error in connection with peripheral (ThunderBoard-React): " + peripheral);
			console.log(error);
			return;
		}
		bus.emit('sensor_group_connected',SensorDetails.GroupId);
		console.log('connected to peripheral (ThunderBoard-React): '	+ peripheral.uuid);

		peripheral.discoverServices([],function(error, services) {
			//console.log('discovered the following services:',services);
			for ( var i in services) {
				console.log('  '+ i	+ ' uuid: '	+ services[i].uuid);
			}
			//console.log('discovered the following characteristics:',characteristics);
		});

		peripheral.once('servicesDiscover', function(services) {
			try {
				var capIdAccelerometer = -1;
				var capIdGyroscope = -1;
				var capIdAmbientLight = -1;
				var capIdHumidity = -1;
				var capIdTemperature = -1;
				var capIdUVIndex = -1;

				for(var item in SensorDetails.SensorCapabilities) {
					if(SensorDetails.SensorCapabilities[item].Name == "Accelerometer") {
						capIdAccelerometer = SensorDetails.SensorCapabilities[item].Id;
					} else if(SensorDetails.SensorCapabilities[item].Name == "Gyroscope") {
						capIdGyroscope = SensorDetails.SensorCapabilities[item].Id;
					} else if(SensorDetails.SensorCapabilities[item].Name == "Luxometer"){
						capIdAmbientLight = SensorDetails.SensorCapabilities[item].Id;
					} else if(SensorDetails.SensorCapabilities[item].Name == "Humidity"){
						capIdHumidity = SensorDetails.SensorCapabilities[item].Id;
					} else if(SensorDetails.SensorCapabilities[item].Name == "AmbientTemperature"){
						capIdTemperature = SensorDetails.SensorCapabilities[item].Id;
					} else if(SensorDetails.SensorCapabilities[item].Name == "UVIndex"){
						capIdUVIndex = SensorDetails.SensorCapabilities[item].Id;
					}
					if(capIdAccelerometer != -1 && capIdGyroscope != -1 && capIdAmbientLight != -1 && capIdHumidity != -1 && capIdTemperature != -1 && capIdUVIndex != -1) {
						break;
					}
				}

				for ( var i in services) {
					console.log("service ", services[i].uuid);
					if(services[i].uuid == "a4e649f44be511e5885dfeff819cdc9f") {
						if (capIdAccelerometer > -1 || capIdGyroscope > -1) {		
							var AccelerometerOrientationService = services[8]; //uuid: 0xa4e649f4-4be5-11e5-885d-feff819cdc9f
							if (AccelerometerOrientationService == undefined) {
								return;
							}
							AccelerometerOrientationService.discoverCharacteristics(null,function(error,characteristics) {
								console.log('discovered the following characteristics in AccelerometerOrientationService:');
								for ( var i in characteristics) {
									console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
								}
							});
							AccelerometerOrientationService.once('characteristicsDiscover', function(characteristics){
								console.log("AccelerometerOrientationService characteristicsDiscovered");
								if (capIdGyroscope > -1) {	
									var Orientation = characteristics[1];
									if (Orientation == undefined) {
										return;
									}
									Orientation.on('data', function(data,isNotification) {
										// formatting data
										var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdGyroscope,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
													 AssetBarcode:SensorDetails.AssetBarcode,x:Math.floor((data.readInt16LE(0,1))/100),y:Math.floor((data.readInt16LE(2,3))/100),z:Math.floor((data.readInt16LE(4,5))/100)}// formatting data
										CloudAdaptor(DataWrapper(json_data));// pushing the data to cloud
									});
									Orientation.subscribe(function(error) {
										console.log('Subscription for notification Orientation enabled ',error);
										Orientation.notify(true, function(err){
											console.log('starting OrientationService Sampling',err);
										});
									});
								}
								if (capIdAccelerometer > -1) {	
									var Accelerometer = characteristics[0];
									if (Accelerometer == undefined) {
										return;
									}
									Accelerometer.on('data', function(data,isNotification) {
										// formatting data
										var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdAccelerometer,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
														 AssetBarcode:SensorDetails.AssetBarcode,x:Math.floor((data.readInt16LE(0,1))/100),y:Math.floor((data.readInt16LE(2,3))/100),z:Math.floor((data.readInt16LE(4,5))/100)}// formatting data
										CloudAdaptor(DataWrapper(json_data));// pushing the data to cloud
									});
									Accelerometer.subscribe(function(error) {
											console.log('Subscription for notification Accelerometer enabled ',error);
											Accelerometer.notify(true, function(err){
												console.log('starting Accelerometer Sampling',err);
											});
									});
								}
							});
						}
					}
					if(services[i].uuid == "d24c4f4e17a74548852cabf51127368b") {
						if (capIdAmbientLight > -1) {	
							//var AmbientLightService = services[7];	//uuid: 0xd24c4f4e-17a7-4548-852c-abf51127368b
							var AmbientLightService = services[i];	//uuid: 0xd24c4f4e-17a7-4548-852c-abf51127368b
							if (AmbientLightService == undefined) {
								return;
							}
							AmbientLightService.discoverCharacteristics(null,function(error,characteristics) {
								console.log('discovered the following characteristics in ambient light service:');
								for ( var i in characteristics) {
									console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
								}
							});
							AmbientLightService.once('characteristicsDiscover', function(characteristics){
								var AmbientLight = characteristics[0];
								if (AmbientLight == undefined) {
									return;
								}
								//console.log(Humidity);
								LightInterval = setInterval(function(){
									readAmbientLight(CloudAdaptor,DataWrapper,AmbientLight,SensorDetails,capIdAmbientLight)
								},4000);
							});	
						}
					}
					if(services[i].uuid == "181a") {
						//console.log(EnvironmentService);
						if(capIdHumidity > -1 || capIdTemperature > -1 || capIdUVIndex > -1) {
							var EnvironmentService = services[i]; //uuid: 0x181a
							if (EnvironmentService == undefined) {
								return;
							}
							EnvironmentService.discoverCharacteristics(null,function(error,characteristics) {
								console.log('discovered the following characteristics in environment service:');
								for ( var i in characteristics) {
									console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
								}
							});
							EnvironmentService.once('characteristicsDiscover', function(characteristics){
								var Humidity = characteristics[0];
								var Temperature = characteristics[1];
								var UVIndex = characteristics[2];
								if (Humidity == undefined || Temperature == undefined || UVIndex == undefined) {
									return;
								}
								EnvironInterval = setInterval(function (){
									readEnvironment(CloudAdaptor,DataWrapper,Humidity,Temperature,UVIndex,SensorDetails,capIdHumidity,capIdTemperature,capIdUVIndex,AmbientTempUnit)
								},5000);

							});
						}
					}
				}
			} catch(error) {
				console.log(error);
			}
		});
	});
	
	// listening to peripheral disconnect event to debug
	peripheral.once('disconnect', function(){
		bus.emit('sensor_group_disconnected',SensorDetails.GroupId);
		console.log(peripheral.uuid + " Disconnected (once)");
		clearInterval(LightInterval);
		clearInterval(EnvironInterval);
		clearTimeout(disconnectHandler);
	});
}
module.exports = ThunderboardReact;