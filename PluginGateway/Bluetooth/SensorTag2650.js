var bus = require('../../eventbus');
function SensorTag2650() { };//class for sesnorTag 2650

SensorTag1350DisconnectHandler = function(peripheral,GroupId) {
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

SensorTag2650.prototype.SensorTagHandle2650 = function (peripheral,CloudAdaptor,DataWrapper,SensorDetails,Capabilities,BLEConnectionDuration){ // sensor tag 2650 handle
	
	setTimeout(SensorTag1350DisconnectHandler,BLEConnectionDuration, peripheral,SensorDetails.GroupId);
	
	var AmbientTempUnit = "Celsius";
	var ObjectTempUnit = "Celsius";
	
	if (Capabilities != undefined) {
		Capabilities.forEach(function(elem, index) {
			if (elem.Name == "AmbientTemperature") {
				AmbientTempUnit = elem.Unit;
			} else if (elem.Name == "ObjectTemperature") {
				ObjectTempUnit = elem.Unit;
			}	
		});
	}
	peripheral.connect(function(error) {
		if(error) {
			console.log("Error in connection with peripheral (SensorTag2650): " + peripheral);
			console.log(error);
			return;
		}
		
		bus.emit('sensor_group_connected',SensorDetails.GroupId);
		console.log('connected to peripheral (SensorTag2650): '	+ peripheral.uuid);
		process.on('SIGINT', function() {
			var i_should_exit = true;
			console.log("Caught interrupt signal");
			peripheral.disconnect(function(error){
				if(error) {
					console.log(peripheral.uuid + " Disconnect error", error);
				} else {
					console.log(peripheral.uuid + " Disconnected");
				}
				bus.emit('sensor_group_disconnected',SensorDetails.GroupId);
				clearTimeout(SensorTag2650DisconnectHandler);
			});
			if(i_should_exit)
					process.exit();
		});
		
		peripheral.discoverServices(null,function(error, services) { // service discovery
			console.log('discovered the following services:');
			for ( var i in services) {
				console.log('  '+ i	+ ' uuid: '	+ services[i].uuid);
			}
			
		});
		peripheral.once('servicesDiscover', function(services) { //on service discovery
			try {
			var capIdAmbientTemperature = -1;
			var capIdObjectTemperature = -1;
			var capIdHumidity = -1;
			var capIdBarometricPressure = -1;
			var capIdAccelerometer = -1;
			var capIdMagnetometer = -1;
			var capIdGyroscope = -1;
			var capIdLuxometer = -1;
			for(var item in SensorDetails.SensorCapabilities) {
				if(SensorDetails.SensorCapabilities[item].Name == "AmbientTemperature") {
					capIdAmbientTemperature = SensorDetails.SensorCapabilities[item].Id;
				} else if(SensorDetails.SensorCapabilities[item].Name == "ObjectTemperature") {
					capIdObjectTemperature = SensorDetails.SensorCapabilities[item].Id;
				} else if(SensorDetails.SensorCapabilities[item].Name == "Humidity"){
					capIdHumidity = SensorDetails.SensorCapabilities[item].Id;
				} else if(SensorDetails.SensorCapabilities[item].Name == "BarometricPressure"){
					capIdBarometricPressure = SensorDetails.SensorCapabilities[item].Id;
				} else if(SensorDetails.SensorCapabilities[item].Name == "Accelerometer") {
					capIdAccelerometer = SensorDetails.SensorCapabilities[item].Id;
				} else if(SensorDetails.SensorCapabilities[item].Name == "Magnetometer") {
					capIdMagnetometer = SensorDetails.SensorCapabilities[item].Id;
				} else if(SensorDetails.SensorCapabilities[item].Name == "Gyroscope") {
					capIdGyroscope = SensorDetails.SensorCapabilities[item].Id;
				} else if(SensorDetails.SensorCapabilities[item].Name == "Luxometer"){
					capIdLuxometer = SensorDetails.SensorCapabilities[item].Id;
				}
				if(capIdAmbientTemperature != -1 && capIdObjectTemperature != -1 && capIdHumidity != -1 && capIdBarometricPressure != -1 && capIdAccelerometer != -1 && capIdMagnetometer != -1 && capIdGyroscope != -1 && capIdLuxometer != -1) {
					break;
				}
			}
			
			// Temperature
			if (capIdAmbientTemperature > -1 || capIdObjectTemperature > -1) {			
				var TemperatureService = services[3]; // uuid: f000aa0004514000b000000000000000
				if (TemperatureService == undefined) {
					return;
				}
				TemperatureService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
						console.log('Temperature discovered the following characteristics:');
						for ( var i in characteristics) {
							console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
						}
				});

				TemperatureService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					//console.log("Temperature characteristicsDiscover " + characteristics);
					var startSamplingTemperatureData = characteristics[1];
					var notifyServiceTemperatureData = characteristics[0];

					notifyServiceTemperatureData.on('data', function(data,isNotification) { // notification events form temperature service

						convertIrTemperatureData(data, AmbientTempUnit, ObjectTempUnit, function(objectTemperature, ambientTemperature) {
							if(capIdAmbientTemperature > -1) {
								var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdAmbientTemperature,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
												 AssetBarcode:SensorDetails.AssetBarcode,AmbientTemperature:ambientTemperature};
								CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud							
							}
							if(capIdObjectTemperature > -1) {
								var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdObjectTemperature,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
												 AssetBarcode:SensorDetails.AssetBarcode,ObjectTemperature:objectTemperature};
								CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud							
							}
						});
					});

						var writeData = new Buffer([0x01]);
						notifyServiceTemperatureData.subscribe(function(error) { // enabling notifications for temperature service
							console.log('Temperature Subscription for notification enabled ',error);
							notifyServiceTemperatureData.notify(true, function(){ // starting notifications
								startSamplingTemperatureData.write(new Buffer(writeData),false,function(error) { //writing data to start notifications
									console.log('starting Temperature Sampling',error);
								});
							});
						});
					});
				}

				// Humidity
				if (capIdHumidity > -1) {			
					var HumidityService = services[4]; // uuid: f000aa2004514000b000000000000000
					if (HumidityService == undefined) {
						return;
					}
					HumidityService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
						console.log('Humidity discovered the following characteristics:');
						for ( var i in characteristics) {
							console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
						}
					});

				HumidityService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					//console.log("Humidity characteristicsDiscover " + characteristics);
					var startSamplingHumidityData = characteristics[1];
					var notifyServiceHumidityData = characteristics[0];

					notifyServiceHumidityData.on('data', function(data,isNotification) { // notification events form temperature service
						convertHumidityData(data, function(ambientTemperature, humidity) {
							
							// data in percentage
							var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdHumidity,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
											 AssetBarcode:SensorDetails.AssetBarcode,Humidity:humidity};
							CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
						});
						});
						var writeData = new Buffer([0x01]);
						notifyServiceHumidityData.subscribe(function(error) { // enabling notifications for temperature service
							console.log('Subscription for notification enabled ',error);
							notifyServiceHumidityData.notify(true, function(){ // starting notifications
								startSamplingHumidityData.write(new Buffer(writeData),false,function(error) { //writing data to start notifications
									console.log('starting Humidity Sampling',error);
								});
							});
						});
					});
				}

				// Barometric Pressure
				if (capIdBarometricPressure > -1) {			
					var BarometricPressureService = services[5]; // uuid: f000aa4004514000b000000000000000
					if (BarometricPressureService == undefined) {
						return;
					}
					BarometricPressureService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
						console.log('BarometricPressure discovered the following characteristics:');
						for ( var i in characteristics) {
							console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
						}
					});

				BarometricPressureService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					//console.log("BarometricPressure characteristicsDiscover " + characteristics);
					var startSamplingBarometricPressureData = characteristics[1];
					var notifyServiceBarometricPressureData = characteristics[0];
					
					notifyServiceBarometricPressureData.on('data', function(data,isNotification) { // notification events form temperature service
						convertBarometricPressureData(data, function(barometricPressure) {
							//console.log("Barometric Pressure: ", barometricPressure);
							// data in mBar
							var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdBarometricPressure,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
											 AssetBarcode:SensorDetails.AssetBarcode,BarometricPressure:barometricPressure};
							CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
						});	
						});
						var writeData = new Buffer([0x01]);
						notifyServiceBarometricPressureData.subscribe(function(error) { // enabling notifications for barometric pressure service
							console.log('Subscription for notification enabled ',error);
							notifyServiceBarometricPressureData.notify(true, function(){ // starting notifications
								startSamplingBarometricPressureData.write(new Buffer(writeData),false,function(error) { //writing data to start notifications
									console.log('starting BarometricPressure Sampling',error);
								});
							});
						});
					});
				}

				// MPU9250 (Accelerometer, Magnetometer, Gyroscope)
				if (capIdAccelerometer > -1 || capIdMagnetometer > -1 || capIdGyroscope > -1) {
					var MPU9250Service = services[6]; // uuid: f000aa8004514000b000000000000000
					if (MPU9250Service == undefined) {
						return;
					}
				MPU9250Service.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
						console.log('MPU9250 discovered the following characteristics:');
						for ( var i in characteristics) {
							console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
						}
				});

				MPU9250Service.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					//console.log("MPU9250 characteristicsDiscover " + characteristics);
					var startSamplingMPU9250Data = characteristics[1];
					var notifyServiceMPU9250Data = characteristics[0];
					
					notifyServiceMPU9250Data.on('data', function(data,isNotification) { // notification events form temperature service
						
						convertMPU9250Data(data, function(xA, yA, zA, xG, yG, zG, xM, yM, zM) {
							if(capIdAccelerometer > -1) {
								// data in G
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdAccelerometer,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
													 AssetBarcode:SensorDetails.AssetBarcode,x:xA,y:yA,z:zA};
									CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
							}
							if(capIdMagnetometer > -1) {
								// data in mT
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdMagnetometer,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
													 AssetBarcode:SensorDetails.AssetBarcode,x:xM,y:yM,z:zM};
									CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
							}
							if (capIdGyroscope > -1) {
								// data in degree/s
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdGyroscope,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
													 AssetBarcode:SensorDetails.AssetBarcode,x:xG,y:yG,z:zG};
									CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
							}
						});
						});


						var buffer = new Buffer(2);
						buffer.writeUInt16LE(0x007f, 0);
						var withoutResponse = (startSamplingMPU9250Data.properties.indexOf('writeWithoutResponse') !== -1) &&
							  (startSamplingMPU9250Data.properties.indexOf('write') === -1);

						notifyServiceMPU9250Data.subscribe(function(error) { // enabling notifications for MPU9250 service
							console.log('Subscription for notification enabled ',error);
							notifyServiceMPU9250Data.notify(true, function(){ // starting notifications
								startSamplingMPU9250Data.write(buffer,withoutResponse,function(error) { //writing data to start notifications
									console.log('starting MPU9250 Sampling',error);
								});
							});
						});
					});
				}

				// Luxometer
				if (capIdLuxometer > -1) {			
					var LuxometerService = services[7]; // uuid: f000aa7004514000b000000000000000
					if (LuxometerService == undefined) {
						return;
					}
				LuxometerService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
						console.log('Luxometer discovered the following characteristics:');
						for ( var i in characteristics) {
							console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
						}
				});

				LuxometerService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					//console.log("Luxometer characteristicsDiscover " + characteristics);
					var startSamplingLuxometerData = characteristics[1];
					var notifyServiceLuxometerData = characteristics[0];
					
					notifyServiceLuxometerData.on('data', function(data,isNotification) { // notification events form temperature service
						convertLuxometerData(data, function(lux) {
							// data in lux
							var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdLuxometer,GroupId:SensorDetails.GroupId,Timestamp: new Date(),
											 AssetBarcode:SensorDetails.AssetBarcode,Luxometer:lux};
							CloudAdaptor(DataWrapper(json_data)); // pushing the data to cloud
						});
						});
						var writeData = new Buffer([0x01]);
						notifyServiceLuxometerData.subscribe(function(error) { // enabling notifications for Luxometer service
							console.log('Subscription for notification enabled ',error);
							notifyServiceLuxometerData.notify(true, function(){ // starting notifications
								startSamplingLuxometerData.write(new Buffer(writeData),false,function(error) { //writing data to start notifications
									console.log('starting Luxometer Sampling',error);
								});
							});
						});
					});
				}

			} catch(error) {
				console.log(error);
			}
		});
	});
};

convertIrTemperatureData = function(data, AmbientTempUnit, ObjectTempUnit, callback) {
	var ambientTemperature = data.readInt16LE(2) / 128.0;	//Celsius
	var objectTemperature = data.readInt16LE(0) / 128.0;	//Celsius
	if (AmbientTempUnit == "Fahrenheit") {
		ambientTemperature = (ambientTemperature * 1.8) + 32;
	} else if(AmbientTempUnit == "Kelvin") {
		ambientTemperature = ambientTemperature + 273.15;
	}
	if (ObjectTempUnit == "Fahrenheit") {
		objectTemperature = (objectTemperature * 1.8) + 32;
	} else if(ObjectTempUnit == "Kelvin") {
		objectTemperature = objectTemperature + 273.15;
	}
  	callback(objectTemperature, ambientTemperature);
};

convertHumidityData = function(data, callback) {
  var temperature = -46.85 + 175.72 / 65536.0 * data.readUInt16LE(0);
  var humidity = -6.0 + 125.0 / 65536.0 * (data.readUInt16LE(2) & ~0x0003);

  callback(temperature, humidity);
};

convertBarometricPressureData = function(data, callback) {
  // data is returned as
  // Firmare 0.89 16 bit single precision float
  // Firmare 1.01 24 bit single precision float

  var flTempBMP;
  var flPressure;

  if (data.length > 4) {
    // Firmware 1.01

    flTempBMP = (data.readUInt32LE(0) & 0x00ffffff)/ 100.0;
    flPressure = ((data.readUInt32LE(2) >> 8) & 0x00ffffff) / 100.0;
  } else {
    // Firmware 0.89

    var tempBMP = data.readUInt16LE(0);
    var tempExponent = (tempBMP & 0xF000) >> 12;
    var tempMantissa = (tempBMP & 0x0FFF);
    flTempBMP = tempMantissa * Math.pow(2, tempExponent) / 100.0;

    var tempPressure = data.readUInt16LE(2);
    var pressureExponent = (tempPressure & 0xF000) >> 12;
    var pressureMantissa = (tempPressure & 0x0FFF);
    flPressure = pressureMantissa * Math.pow(2, pressureExponent) / 100.0;
  }

  callback(flPressure);
};

convertLuxometerData = function(data, callback) {
  var rawLux = data.readUInt16LE(0);

  var exponent = (rawLux & 0xF000) >> 12;
  var mantissa = (rawLux & 0x0FFF);

  var flLux = mantissa * Math.pow(2, exponent) / 100.0;

  callback(flLux);
};

convertMPU9250Data = function(data, callback) {
	try {
		  // 250 deg/s range
		  var xG = data.readInt16LE(0) / 128.0;
		  var yG = data.readInt16LE(2) / 128.0;
		  var zG = data.readInt16LE(4) / 128.0;

		  // we specify 8G range in setup
		  var x = data.readInt16LE(6) / 4096.0;
		  var y = data.readInt16LE(8) / 4096.0;
		  var z = data.readInt16LE(10) / 4096.0;

		  // magnetometer (page 50 of http://www.invensense.com/mems/gyro/documents/RM-MPU-9250A-00.pdf)
		  var xM = data.readInt16LE(12) * 4912.0 / 32768.0;
		  var yM = data.readInt16LE(14) * 4912.0 / 32768.0;
		  var zM = data.readInt16LE(16) * 4912.0 / 32768.0;

		  callback(x, y, z, xG, yG, zG, xM, yM, zM);
	} catch (err) {
		console.log(err);
	}
};

module.exports = SensorTag2650;
