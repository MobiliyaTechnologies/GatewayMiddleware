function ThunderboardSense () { };//class for thunderboard sense
var EnvironInterval;
var LightInterval;
function readEnvironment (peripheral,CloudAdaptor,DataWrapper,Humidity,Temperature,UVIndex,AmbientLight,BarometricPressure,NoiseLevel,SensorDetails,capIdHumidity,capIdTemperature,capIdUVIndex,capIdAmbientLight,capIdBarometricPressure,capIdNoiseLevel) {
	
	if(capIdUVIndex > -1) {
		UVIndex.read(function(err,data){
			// formatting data in Scale (int) in SI units
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdUVIndex,GroupId:SensorDetails.GroupId,timestamp: new Date(),UVIndex:(data.readUInt8())};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","UVIndex",json_data));
		});
	}
	if (capIdBarometricPressure > -1) {	
		BarometricPressure.read(function(err,data){
			// formatting data in mBar in SI units
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdBarometricPressure,GroupId:SensorDetails.GroupId,timestamp: new Date(),
				BarometricPressure:(data.readUInt16LE(0)/1000)};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","BarometricPressure",json_data));// pushing the data to cloud
		});
	}
	if(capIdTemperature > -1) {
		Temperature.read(function(err,data){
				// formatting data in degree celsius in SI units
			var val = parseFloat(data.readUInt16LE().toString().slice(0,2)+"."+data.readUInt16LE().toString().slice(2,4));
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdTemperature,GroupId:SensorDetails.GroupId,timestamp: new Date(),Temperature:val};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","AmbientTemperature",json_data));
		});
	}
	if (capIdHumidity > -1) {
		Humidity.read(function(err,data){
			// formatting data in RH in SI units
			var val = parseFloat(data.readUInt16LE().toString().slice(0,2)+"."+data.readUInt16LE().toString().slice(2,4));
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdHumidity,GroupId:SensorDetails.GroupId,timestamp: new Date(),Humidity:val};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Humidity",json_data));
		});
	}
	if (capIdAmbientLight > -1) {	
		AmbientLight.read(function(err,data){
			// formatting data in Lux in SI units
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdAmbientLight,GroupId:SensorDetails.GroupId,timestamp: new Date(),
						Luxometer:(Math.floor(data.readUInt32LE(0)/100))};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Luxometer",json_data));
		});
	}
	if (capIdNoiseLevel > -1) {	
		NoiseLevel.read(function(err,data){
			// formatting data in db in SI units
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdNoiseLevel,GroupId:SensorDetails.GroupId,timestamp: new Date(),
				NoiseLevel:(data.readUInt16LE()/100)}
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","NoiseLevel",json_data));// pushing the data to cloud
		});
	}
};

ThunderboardSense.prototype.ThunderboardSenseHandle= function (peripheral,CloudAdaptor,DataWrapper, SensorDetails){
	peripheral.connect(function(error) {
		console.log('connected to peripheral: '	+ peripheral.uuid);

		peripheral.discoverServices([],function(error, services) {
			//console.log('discovered the following services:',services);
			for ( var i in services) {
				console.log('  '+ i	+ ' uuid: '	+ services[i].uuid);
			}
			//console.log('discovered the following characteristics:',characteristics);
		});

		peripheral.once('servicesDiscover', function(services){
			
			var capIdAccelerometer = -1;
			var capIdGyroscope = -1;
			var capIdAmbientLight = -1;
			var capIdHumidity = -1;
			var capIdTemperature = -1;
			var capIdUVIndex = -1;
			var capIdBarometricPressure = -1;
			var capIdNoiseLevel = -1;
			
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
				} else if(SensorDetails.SensorCapabilities[item].Name == "BarometricPressure"){
					capIdBarometricPressure = SensorDetails.SensorCapabilities[item].Id;
				} else if(SensorDetails.SensorCapabilities[item].Name == "NoiseLevel"){
					capIdNoiseLevel = SensorDetails.SensorCapabilities[item].Id;
				}
				if(capIdAccelerometer != -1 && capIdGyroscope != -1 && capIdAmbientLight != -1 && capIdHumidity != -1 && capIdTemperature != -1 && capIdUVIndex != -1
				  	 && capIdBarometricPressure != -1 && capIdNoiseLevel != -1) {
					break;
				}
			}
			
			if (capIdAccelerometer > -1 || capIdGyroscope > -1) {		
				var AccelerometerOrientationService = services[9]; //uuid: 0xa4e649f4-4be5-11e5-885d-feff819cdc9f

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

						Orientation.on('data', function(data,isNotification) {
							// formatting data
							var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdGyroscope,GroupId:SensorDetails.GroupId,timestamp: new Date(),
										 x:Math.floor((data.readInt16LE(0,1))/100),y:Math.floor((data.readInt16LE(2,3))/100),z:Math.floor((data.readInt16LE(4,5))/100)}// formatting data
							CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Gyroscope",json_data));// pushing the data to cloud
						});
						Orientation.subscribe(function(error) {
							console.log('Subscription for notification Orientation enabled ',error);
							Orientation.notify(true, function(){
								console.log('starting OrientationService Sampling',error);
							});
						});
					}
					if (capIdAccelerometer > -1) {	
						var Accelerometer = characteristics[0];
						Accelerometer.on('data', function(data,isNotification) {
							// formatting data
							var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdAccelerometer,GroupId:SensorDetails.GroupId,timestamp: new Date(),
											 x:Math.floor((data.readInt16LE(0,1))/100),y:Math.floor((data.readInt16LE(2,3))/100),z:Math.floor((data.readInt16LE(4,5))/100)}// formatting data
							CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-Sense","Accelerometer",json_data));// pushing the data to cloud
						});
						Accelerometer.subscribe(function(error) {
								console.log('Subscription for notification Accelerometer enabled ',error);
								Accelerometer.notify(true, function(){
									console.log('starting Accelerometer Sampling',error);
								});
						});
					}
				});
			}
			
			
			console.log(EnvironmentService);
			if(capIdHumidity > -1 || capIdTemperature > -1 || capIdUVIndex > -1 || capIdAmbientLight > -1 || capIdBarometricPressure > -1 || capIdNoiseLevel > -1) {
				var EnvironmentService = services[4]; //uuid: 0x181a
				EnvironmentService.discoverCharacteristics(null,function(error,characteristics) {
					console.log('discovered the following characteristics in environment service:');
					for ( var i in characteristics) {
						console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
					}
				});
				
				EnvironmentService.once('characteristicsDiscover', function(characteristics){					
					var UVIndex = characteristics[0];						//2a76	
					var BarometricPressure = characteristics[1];	 //2a6d
					var Temperature = characteristics[2];				 //2a6e
					var Humidity = characteristics[3];						 //2a6f
					var AmbientLight = characteristics[4];				  //c8546913bfd945eb8dde9f8754f4a32e
					var NoiseLevel = characteristics[5];				   //c8546913bf0245eb8dde9f8754f4a32e
					
					EnvironInterval = setInterval(function (){
						readEnvironment(peripheral,CloudAdaptor,DataWrapper,Humidity,Temperature,UVIndex,AmbientLight,BarometricPressure,NoiseLevel,SensorDetails,capIdHumidity,capIdTemperature,capIdUVIndex,capIdAmbientLight,capIdBarometricPressure,capIdNoiseLevel)
					},5000);

				});
			}
			
		});
	});
	
	// listening to peripheral disconnect event to debug
	peripheral.once('disconnect', function(){
		console.log("Disconnected to peripheral :", peripheral.id);
		clearInterval(LightInterval);
		clearInterval(EnvironInterval);
	});
}
module.exports = ThunderboardSense;