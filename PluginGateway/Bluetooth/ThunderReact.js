function ThunderboardReact () { };//class for thunderboard react
var EnvironInterval;
var LightInterval;
function readEnvironment (peripheral,CloudAdaptor,DataWrapper,Humidity,Temperature,UVIndex,SensorDetails,capIdHumidity,capIdTemperature,capIdUVIndex) {
	if (capIdHumidity > -1) {
		Humidity.read(function(err,data){
			// formatting data in RH in SI units
			var val = parseFloat(data.readUInt16LE().toString().slice(0,2)+"."+data.readUInt16LE().toString().slice(2,4));
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdHumidity,GroupId:SensorDetails.GroupId,timestamp: new Date(),Humidity:val};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","Humidity",json_data));
		});
	}
	if(capIdTemperature > -1) {
		Temperature.read(function(err,data){
				// formatting data in degree celsius in SI units
			var val = parseFloat(data.readUInt16LE().toString().slice(0,2)+"."+data.readUInt16LE().toString().slice(2,4));
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdTemperature,GroupId:SensorDetails.GroupId,timestamp: new Date(),Temperature:val};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","AmbientTemperature",json_data));
		});
	}
	if(capIdUVIndex > -1) {
		UVIndex.read(function(err,data){
			// formatting data in Scale (int) in SI units
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdUVIndex,GroupId:SensorDetails.GroupId,timestamp: new Date(),UVIndex:(data.readUInt8())};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","UVIndex",json_data));
		});
	}
};

function readAmbientLight(peripheral,CloudAdaptor,DataWrapper,AmbientLight,SensorDetails,capIdAmbientLight){
	if(capIdAmbientLight > -1) {
		AmbientLight.read(function(err,data){
			// formatting data in Lux in SI units
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capIdAmbientLight,GroupId:SensorDetails.GroupId,timestamp: new Date(),
										 Luminescence:(Math.floor(data.readUInt16LE()/10))};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","Luxometer",json_data));
			
		});
	}
};

ThunderboardReact.prototype.ThunderboardReactHandle= function (peripheral,CloudAdaptor,DataWrapper, SensorDetails){
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
			/*
			if (capIdAccelerometer > -1 || capIdGyroscope > -1) {		
				var AccelerometerOrientationService = services[8]; //uuid: 0xa4e649f4-4be5-11e5-885d-feff819cdc9f

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
							CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","Gyroscope",json_data));// pushing the data to cloud
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
							CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","Accelerometer",json_data));// pushing the data to cloud
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
			*/
			if (capIdAmbientLight > -1) {	
				var AmbientLightService = services[7];	//uuid: 0xd24c4f4e-17a7-4548-852c-abf51127368b
				AmbientLightService.discoverCharacteristics(null,function(error,characteristics) {
					console.log('discovered the following characteristics in ambient light service:');
					for ( var i in characteristics) {
						console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
					}
				});
				AmbientLightService.once('characteristicsDiscover', function(characteristics){
					var AmbientLight = characteristics[0];
					//console.log(Humidity);
					LightInterval = setInterval(function(){readAmbientLight(peripheral,CloudAdaptor,DataWrapper,AmbientLight,SensorDetails,capIdAmbientLight)},4000);
				});	
			}
			//console.log(EnvironmentService);
			if(capIdHumidity > -1 || capIdTemperature > -1 || capIdUVIndex > -1) {
				var EnvironmentService = services[6]; //uuid: 0x181a
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
					
					EnvironInterval = setInterval(function (){
						readEnvironment(peripheral,CloudAdaptor,DataWrapper,Humidity,Temperature,UVIndex,SensorDetails,capIdHumidity,capIdTemperature,capIdUVIndex)
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
module.exports = ThunderboardReact;