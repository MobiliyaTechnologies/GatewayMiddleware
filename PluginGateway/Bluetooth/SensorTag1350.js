function SensorTag1350 () { };//class for SensorTag1350
SensorTag1350.prototype.SensorTagHandle1350 = function (peripheral,CloudAdaptor,DataWrapper, SensorDetails){ // sensor tag 1350 handle
	peripheral.connect(function(error) { //connect
		console.log('connected to peripheral (SensorTag1350): '	+ peripheral.uuid);
		process.on('SIGINT', function() {
			console.log("Caught interrupt signal");
			peripheral.disconnect(function(error){
				console.log(peripheral.uuid + " Disconnected")
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
		peripheral.once('servicesDiscover', function(services){ //on service discovery
			console.log("servicesDiscover Services: " + services);

			// Temperature
			var capIdTemperature = -1;
			for(var item in SensorDetails.SensorCapabilities) {
				if(SensorDetails.SensorCapabilities[item].Name == "AmbientTemperature" || SensorDetails.SensorCapabilities[item].Name == "ObjectTemperature") {
					capIdTemperature = SensorDetails.SensorCapabilities[item].Id;
					break;
				}
			}
			if (capIdTemperature > -1) {			
				var TemperatureService = services[4]; // uuid: f000aa0004514000b000000000000000

				TemperatureService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
					console.log('Temperature discovered the following characteristics:');
					for ( var i in characteristics) {
						console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
					}
				});

				TemperatureService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					console.log("Temperature characteristicsDiscover " + characteristics);
					var startSamplingTemperatureData = characteristics[1];
					var notifyServiceTemperatureData = characteristics[0];

					notifyServiceTemperatureData.on('data', function(data,isNotification) { // notification events form temperature service

						convertIrTemperatureData(data, function(objectTemperature, ambientTemperature) {
							//console.log("Object Temperature: ", objectTemperature);
							//console.log("Ambient Temperature: ", ambientTemperature);
							var ambTemp = false;
							var objTemp = false;
							for(var item in SensorDetails.SensorCapabilities) {
								if(SensorDetails.SensorCapabilities[item].Name == "AmbientTemperature") {
									var capId = SensorDetails.SensorCapabilities[item].Id;
									// data in degree celsius in SI units
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),AmbientTemperature:ambientTemperature};
									CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","AmbientTemperature",json_data)); // pushing the data to cloud							
									ambTemp = true;
									if(ambTemp && objTemp) {
										break;
									}
								}
								if(SensorDetails.SensorCapabilities[item].Name == "ObjectTemperature") {
									var capId = SensorDetails.SensorCapabilities[item].Id;
									// data in degree celsius in SI units
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),ObjectTemperature:objectTemperature};
									CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","ObjectTemperature",json_data)); // pushing the data to cloud							
									objTemp = true;
									if(ambTemp && objTemp) {
										break;
									}
								}
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
			var capIdHumidity = -1;
			for(var item in SensorDetails.SensorCapabilities) {
				if(SensorDetails.SensorCapabilities[item].Name == "Humidity") {
					capIdHumidity = SensorDetails.SensorCapabilities[item].Id;
					break;
				}
			}
			if (capIdHumidity > -1) {			
				var HumidityService = services[5]; // uuid: f000aa2004514000b000000000000000

				HumidityService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
					console.log('Humidity discovered the following characteristics:');
					for ( var i in characteristics) {
						console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
					}
				});

				HumidityService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					console.log("Humidity characteristicsDiscover " + characteristics);
					var startSamplingHumidityData = characteristics[1];
					var notifyServiceHumidityData = characteristics[0];

					notifyServiceHumidityData.on('data', function(data,isNotification) { // notification events form temperature service
						convertHumidityData(data, function(ambientTemperature, humidity) {
							//console.log("Ambient Temperature: ", ambientTemperature);
							//console.log("Humidity: ", humidity);
							for(var item in SensorDetails.SensorCapabilities) {
								if(SensorDetails.SensorCapabilities[item].Name == "Humidity") {
									var capId = SensorDetails.SensorCapabilities[item].Id;
									// data in percentage
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),Humidity:humidity};
									CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","Humidity",json_data)); // pushing the data to cloud
									break;
								}
							}
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
			var capIdBarometricPressure = -1;
			for(var item in SensorDetails.SensorCapabilities) {
				if(SensorDetails.SensorCapabilities[item].Name == "BarometricPressure") {
					capIdBarometricPressure = SensorDetails.SensorCapabilities[item].Id;
					break;
				}
			}
			if (capIdBarometricPressure > -1) {			
				var BarometricPressureService = services[6]; // uuid: f000aa4004514000b000000000000000

				BarometricPressureService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
					console.log('BarometricPressure discovered the following characteristics:');
					for ( var i in characteristics) {
						console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
					}
				});

				BarometricPressureService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					console.log("BarometricPressure characteristicsDiscover " + characteristics);
					var startSamplingBarometricPressureData = characteristics[1];
					var notifyServiceBarometricPressureData = characteristics[0];
					
					notifyServiceBarometricPressureData.on('data', function(data,isNotification) { // notification events form temperature service
						convertBarometricPressureData(data, function(barometricPressure) {
							//console.log("Barometric Pressure: ", barometricPressure);
							for(var item in SensorDetails.SensorCapabilities) {
								if(SensorDetails.SensorCapabilities[item].Name == "BarometricPressure") {
									var capId = SensorDetails.SensorCapabilities[item].Id;
									// data in mBar
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),BarometricPressure:barometricPressure};
									CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","BarometricPressure",json_data)); // pushing the data to cloud
									break;
								}
							}
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
			var capIdMPU9250 = -1;
			for(var item in SensorDetails.SensorCapabilities) {
				if(SensorDetails.SensorCapabilities[item].Name == "Accelerometer" || SensorDetails.SensorCapabilities[item].Name == "Magnetometer" || SensorDetails.SensorCapabilities[item].Name == "Gyroscope") {
					capIdMPU9250 = SensorDetails.SensorCapabilities[item].Id;
					break;
				}
			}
			if (capIdMPU9250 > -1) {
				var MPU9250Service = services[7]; // uuid: f000aa8004514000b000000000000000

				MPU9250Service.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
					console.log('MPU9250 discovered the following characteristics:');
					for ( var i in characteristics) {
						console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
					}
				});

				MPU9250Service.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					console.log("MPU9250 characteristicsDiscover " + characteristics);
					var startSamplingMPU9250Data = characteristics[1];
					var notifyServiceMPU9250Data = characteristics[0];
					
					notifyServiceMPU9250Data.on('data', function(data,isNotification) { // notification events form temperature service
						
						console.log("***************************");
						console.log("***************************");
						console.log("MPU9250: ", data.readInt16LE().toString());
						
						
						convertMPU9250Data(data, function(xA, yA, zA, xG, yG, zG, xM, yM, zM) {
							var accelData = false;
							var magnData = false;
							var gyroData = false;
							for(var item in SensorDetails.SensorCapabilities) {
								if(SensorDetails.SensorCapabilities[item].Name == "Accelerometer") {
									var capId = SensorDetails.SensorCapabilities[item].Id;
									// data in G
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),x:xA,y:yA,z:zA};
									CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","Accelerometer",json_data)); // pushing the data to cloud
									accelData = true;
									if(accelData && magnData && gyroData) {
										break;
									}
								} else if(SensorDetails.SensorCapabilities[item].Name == "Magnetometer") {
									var capId = SensorDetails.SensorCapabilities[item].Id;
									// data in G
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),x:xM,y:yM,z:zM};
									CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","Magnetometer",json_data)); // pushing the data to cloud
									magnData = true;
									if(accelData && magnData && gyroData) {
										break;
									}
								} else if(SensorDetails.SensorCapabilities[item].Name == "Gyroscope") {
									var capId = SensorDetails.SensorCapabilities[item].Id;
									// data in G
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),x:xG,y:yG,z:zG};
									CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","Gyroscope",json_data)); // pushing the data to cloud
									gyroData = true;
									if(accelData && magnData && gyroData) {
										break;
									}
								}
							}
						});
					});
					var writeData = new Buffer([0x01]);
					notifyServiceMPU9250Data.subscribe(function(error) { // enabling notifications for MPU9250 service
						console.log('Subscription for notification enabled ',error);
						notifyServiceMPU9250Data.notify(true, function(){ // starting notifications
							startSamplingMPU9250Data.write(new Buffer(writeData),false,function(error) { //writing data to start notifications
								console.log('starting MPU9250 Sampling',error);
							});
						});
					});
				});
			}
			
			
			// Luxometer
			var capIdLuxometer = -1;
			for(var item in SensorDetails.SensorCapabilities) {
				if(SensorDetails.SensorCapabilities[item].Name == "Luxometer") {
					capIdLuxometer = SensorDetails.SensorCapabilities[item].Id;
					break;
				}
			}
			if (capIdLuxometer > -1) {			
				var LuxometerService = services[8]; // uuid: f000aa7004514000b000000000000000

				LuxometerService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
					console.log('Luxometer discovered the following characteristics:');
					for ( var i in characteristics) {
						console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
					}
				});

				LuxometerService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
					console.log("Luxometer characteristicsDiscover " + characteristics);
					var startSamplingLuxometerData = characteristics[1];
					var notifyServiceLuxometerData = characteristics[0];
					
					notifyServiceLuxometerData.on('data', function(data,isNotification) { // notification events form temperature service
						convertLuxometerData(data, function(lux) {
							for(var item in SensorDetails.SensorCapabilities) {
								if(SensorDetails.SensorCapabilities[item].Name == "Luxometer") {
									var capId = SensorDetails.SensorCapabilities[item].Id;
									// data in lux
									var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),Luxometer:lux};
									CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","Luxometer",json_data)); // pushing the data to cloud
									break;
								}
							}
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
			//------------
		});
	});
};

convertIrTemperatureData = function(data, callback) {
	var ambientTemperature = data.readInt16LE(2) / 128.0;
	var objectTemperature = data.readInt16LE(0) / 128.0;
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

module.exports = SensorTag1350;