function ThunderboardSense () { };
ThunderboardSense.prototype.ThunderboardSenseHandle = function (peripheral,CloudAdaptor,DataWrapper, SensorDetails){
	peripheral.connect(function(error) {
		console.log('connected to peripheral: '	+ peripheral.uuid);

		peripheral.discoverServices([],function(error, services) {
			//console.log('discovered the following services:',services);
			//console.log(services[6]);
			for ( var i in services) {
				console.log('  '+ i	+ ' uuid: '	+ services[i].uuid);
			}
			//console.log('discovered the following characteristics:',characteristics);
		});

		peripheral.once('servicesDiscover', function(services){
			var AmbientLightService = services[7];
			var EnvironmentService = services[4];
			var AccelerometerOrientationService = services[9];
			AccelerometerOrientationService.discoverCharacteristics(null,function(error,characteristics) {
				console.log('discovered the following characteristics in AccelerometerOrientationService:');
				for ( var i in characteristics) {
					console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
				}
			});
			AccelerometerOrientationService.once('characteristicsDiscover', function(characteristics){
				var Accelerometer = characteristics[0];
				var Orientation = characteristics[1];
				var Calibration = characteristics[2];
				Calibration.on('data', function(data,isNotification) {
					//var data = data.toString('utf-8');
					console.log("Calibration Done :",data);
					/*
					Accelerometer.on('data', function(data,isNotification) {
						//var data = data.toString('utf-8');
						console.log("Accelerometer :",data.readInt16LE(0,1),data.readInt16LE(2,3),data.readInt16LE(4,5));
						//console.log(data);
					});
					Accelerometer.subscribe(function(error) {
						console.log('Subscription for notification AccelerometerService enabled ',error);
						Accelerometer.notify(true, function(){
							console.log('starting Accelerometer Sampling',error);
						});
					});
					*/
					Orientation.on('data', function(data,isNotification) {
						//var data = data.toString('utf-8');
						console.log("Orientation :",data.readInt16LE(0,1),data.readInt16LE(2,3),data.readInt16LE(4,5));
						
						var capId = 0;
						var hasCapability = false;
						for(var item in SensorDetails.SensorCapabilities) {
							if(SensorDetails.SensorCapabilities[item].Name == "Orientation") {
								capId = SensorDetails.SensorCapabilities[item].Id;
								hasCapability = false;
								break;
							}
						}
						if (hasCapability) {
							// formatting data in Lux in SI units
							var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),			 
											 x:(data.readInt16LE(0,1)),y:(data.readInt16LE(2,3)),z:(data.readInt16LE(4,5))}
							CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Orientation",json_data));// pushing the data to cloud
							console.log(json_data);
						}
						
						//console.log(data);
					});
					Orientation.subscribe(function(error) {
						console.log('Subscription for notification OrientationService enabled ',error);
						Orientation.notify(true, function(){
							console.log('starting OrientationService Sampling',error);
						});
					});
						//console.log(data);
				});
				Calibration.subscribe(function(error) {
					console.log('Subscription for indication Calibration enabled ',error);
					Calibration.notify(true, function(){
						console.log('starting Calibration',error);
					});
				});
				var writeData = new Buffer("01","hex");
				Calibration.write(new Buffer(writeData),false,function(error) {
					console.log('Started Calibration  ',error);
				});
				
				
			});
			//console.log(EnvironmentService);
			EnvironmentService.discoverCharacteristics(null,function(error,characteristics) {
				console.log('discovered the following characteristics in environment service:');
				for ( var i in characteristics) {
					console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
				}
			});
			EnvironmentService.once('characteristicsDiscover', function(characteristics){
				var UVIndex = characteristics[0];
				//console.log(Humidity);
				var Pressure = characteristics[1];
				var Temperature = characteristics[2];
				var Humidity = characteristics[3];
				var Luminescence = characteristics[4];
				var NoiseLevel = characteristics[5];
				
				Pressure.read(function(err,data){
					console.log("Pressure :", data.readUInt32LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","Pressure",data.readUInt16LE()));
					var capId = 0;
					var hasCapability = false;
					for(var item in SensorDetails.SensorCapabilities) {
						if(SensorDetails.SensorCapabilities[item].Name == "Pressure") {
							capId = SensorDetails.SensorCapabilities[item].Id;
							hasCapability = false;
							break;
						}
					}
					if (hasCapability) {
						// formatting data in Lux in SI units
						var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
													 Pressure:data.readUInt16LE()}
						CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Pressure",json_data));// pushing the data to cloud
						console.log(json_data);
					}
				});
				Luminescence.read(function(err,data){
					console.log("Light Data :", data.readUInt32LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","Luminescence",data.readUInt16LE()));
					var capId = 0;
					var hasCapability = false;
					for(var item in SensorDetails.SensorCapabilities) {
						if(SensorDetails.SensorCapabilities[item].Name == "Luminescence") {
							capId = SensorDetails.SensorCapabilities[item].Id;
							hasCapability = false;
							break;
						}
					}
					if (hasCapability) {
						// formatting data in Lux in SI units
						var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
													 Luminescence:data.readUInt16LE()}
						CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Luminescence",json_data));// pushing the data to cloud
						console.log(json_data);
					}
				});
				NoiseLevel.read(function(err,data){
					console.log("NoiseLevel Data :", data.readUInt16LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","NoiseLevel",data.readUInt16LE()));
					var capId = 0;
					var hasCapability = false;
					for(var item in SensorDetails.SensorCapabilities) {
						if(SensorDetails.SensorCapabilities[item].Name == "NoiseLevel") {
							capId = SensorDetails.SensorCapabilities[item].Id;
							hasCapability = false;
							break;
						}
					}
					if (hasCapability) {
						// formatting data in Lux in SI units
						var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
													 NoiseLevel:data.readUInt16LE()}
						CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","NoiseLevel",json_data));// pushing the data to cloud
						console.log(json_data);
					}
				});
				Humidity.read(function(err,data){
					console.log("Humidty Data :", data.readUInt16LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","Humidty",data.readUInt16LE()));
					var capId = 0;
					var hasCapability = false;
					for(var item in SensorDetails.SensorCapabilities) {
						if(SensorDetails.SensorCapabilities[item].Name == "Humidity") {
							capId = SensorDetails.SensorCapabilities[item].Id;
							hasCapability = false;
							break;
						}
					}
					if (hasCapability) {
						// formatting data in Lux in SI units
						var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
													 Humidity:data.readUInt16LE()}
						CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Humidity",json_data));// pushing the data to cloud
						console.log(json_data);
					}
				});
				Temperature.read(function(err,data){
					console.log("Temperature Data :", data.readUInt16LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","Temperature",data.readUInt16LE()));
					var capId = 0;
					var hasCapability = false;
					for(var item in SensorDetails.SensorCapabilities) {
						if(SensorDetails.SensorCapabilities[item].Name == "Temperature") {
							capId = SensorDetails.SensorCapabilities[item].Id;
							hasCapability = false;
							break;
						}
					}
					if (hasCapability) {
						// formatting data in Lux in SI units
						var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
													 Temperature:data.readUInt16LE()}
						CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Temperature",json_data));// pushing the data to cloud
						console.log(json_data);
					}
				});
				UVIndex.read(function(err,data){
					console.log("UVIndex Data :", data.readUInt8());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","UVIndex",data.readUInt16LE()));
					var capId = 0;
					var hasCapability = false;
					for(var item in SensorDetails.SensorCapabilities) {
						if(SensorDetails.SensorCapabilities[item].Name == "UVIndex") {
							capId = SensorDetails.SensorCapabilities[item].Id;
							hasCapability = false;
							break;
						}
					}
					if (hasCapability) {
						// formatting data in Lux in SI units
						var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
													 UVIndex:data.readUInt16LE()}
						CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","UVIndex",json_data));// pushing the data to cloud
						console.log(json_data);
					}
				});
			});		
		});
	});
}
module.exports = ThunderboardSense;