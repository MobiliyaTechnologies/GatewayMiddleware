function ThunderboardReact () { };//class for thunderboard react
var EnvironInterval;
var LightInterval;
function readEnvironment (peripheral,CloudAdaptor,DataWrapper,Humidity,Temperature,UVIndex,SensorDetails) {
	Humidity.read(function(err,data){
		console.log("Humidity Data :", data.readUInt16LE());
		
		var capId = 0;
		var hasCapability = false;
		for(var item in SensorDetails.SensorCapabilities) {
			if(SensorDetails.SensorCapabilities[item].Name == "Humidity") {
				capId = SensorDetails.SensorCapabilities[item].Id;
				hasCapability = true;
				break;
			}
		}
		if(hasCapability) {
			// formatting data in RH in SI units
			var val = parseFloat(data.readUInt16LE().toString().slice(0,2)+"."+data.readUInt16LE().toString().slice(2,4));
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),Humidity:(val)};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","Humidity",json_data));
		}
	});
	Temperature.read(function(err,data){
		console.log("Temperature Data :", data.readUInt16LE());
		
		var capId = 0;
		var hasCapability = false;
		for(var item in SensorDetails.SensorCapabilities) {
			if(SensorDetails.SensorCapabilities[item].Name == "Temperature") {
				capId = SensorDetails.SensorCapabilities[item].Id;
				hasCapability = true;
				break;
			}
		}
		if(hasCapability) {
			// formatting data in degree celsius in SI units
			var val = parseFloat(data.readUInt16LE().toString().slice(0,2)+"."+data.readUInt16LE().toString().slice(2,4));
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
										 Temperature:(val)};
			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","Temperature",json_data));
		}
	});
	
	UVIndex.read(function(err,data){
		console.log("UVIndex Data :", data.readUInt8());
		
		var capId = 0;
		var hasCapability = false;
		for(var item in SensorDetails.SensorCapabilities) {
			if(SensorDetails.SensorCapabilities[item].Name == "UVIndex") {
				capId = SensorDetails.SensorCapabilities[item].Id;
				hasCapability = true;
				break;
			}
		}
		if(hasCapability) {
			// formatting data in Scale (int) in SI units
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
										 UVIndex:(data.readUInt8())};

			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","UVIndex",json_data));
		}
	});
	
};

function readAmbientLight(peripheral,CloudAdaptor,DataWrapper,AmbientLight,SensorDetails){
	AmbientLight.read(function(err,data){
		console.log("AmbientLight Data :", data.readUInt16LE());
		
		var capId = 0;
		var hasCapability = false;
		for(var item in SensorDetails.SensorCapabilities) {
			if(SensorDetails.SensorCapabilities[item].Name == "Luminescence") {
				capId = SensorDetails.SensorCapabilities[item].Id;
				hasCapability = true;
				break;
			}
		}
		if(hasCapability) {
			// formatting data in Lux in SI units
			var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
										 Luminescence:(Math.floor(data.readUInt16LE()/10))};

			CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","Luminescence",json_data));
		}
	});
};
ThunderboardReact.prototype.ThunderboardReactHandle= function (peripheral,CloudAdaptor,DataWrapper, SensorDetails){
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
			var EnvironmentService = services[6];
			var AccelerometerOrientationService = services[8];
			
			AccelerometerOrientationService.discoverCharacteristics(null,function(error,characteristics) {
				console.log('discovered the following characteristics in AccelerometerOrientationService:');
				for ( var i in characteristics) {
					console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
				}
			});
			AccelerometerOrientationService.once('characteristicsDiscover', function(characteristics){
				var Accelerometer = characteristics[0];
				var Orientation = characteristics[1];
				/*
				Orientation.on('data', function(data,isNotification) {
					//var data = data.toString('utf-8');
					console.log("Orientation :",data.readInt16LE(0,1),data.readInt16LE(2,3),data.readInt16LE(4,5));
					//console.log(data);
				});
				Orientation.subscribe(function(error) {
					console.log('Subscription for notification OrientationService enabled ',error);
					Orientation.notify(true, function(){
						console.log('starting OrientationService Sampling',error);
					});
				});
				//console.log(Humidity);
				*/
				Accelerometer.on('data', function(data,isNotification) {
					//var data = data.toString('utf-8');
					//console.log(data.readInt16LE(0,1),data.readInt16LE(2,3),data.readInt16LE(4,5));
					
					
					var capId = 0;
					var hasCapability = false;
					for(var item in SensorDetails.SensorCapabilities) {
						if(SensorDetails.SensorCapabilities[item].Name == "Accelerometer") {
							capId = SensorDetails.SensorCapabilities[item].Id;
							hasCapability = false;
							break;
						}
					}
					if (hasCapability) {
						// formatting data in Lux in SI units
						var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),
													 x:Math.floor((data.readInt16LE(0,1))/100),y:Math.floor((data.readInt16LE(2,3))/100),z:Math.floor((data.readInt16LE(4,5))/100)}// formatting data
							CloudAdaptor(DataWrapper(peripheral.id,"ThundeBoard-React","Accelerometer",json_data));// pushing the data to cloud
							console.log(json_data);
					}
			});
			Accelerometer.subscribe(function(error) {
					console.log('Subscription for notification AccelerometerOrientationService enabled ',error);
					Accelerometer.notify(true, function(){
						console.log('starting Accelerometer Sampling',error);
					});
				});
				
			});
			
			AmbientLightService.discoverCharacteristics(null,function(error,characteristics) {
				console.log('discovered the following characteristics in ambient light service:');
				for ( var i in characteristics) {
					console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
				}
			});
			AmbientLightService.once('characteristicsDiscover', function(characteristics){
				var AmbientLight = characteristics[0];
				//console.log(Humidity);
				LightInterval = setInterval(function(){readAmbientLight(peripheral,CloudAdaptor,DataWrapper,AmbientLight,SensorDetails)},4000);
			});	
			//console.log(EnvironmentService);
			
			EnvironmentService.discoverCharacteristics(null,function(error,characteristics) {
				console.log('discovered the following characteristics in environment service:');
				for ( var i in characteristics) {
					console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
				}
			});
			EnvironmentService.once('characteristicsDiscover', function(characteristics){
				var Humidity = characteristics[0];
				//console.log(Humidity);
				var Temperature = characteristics[1];
				var UVIndex = characteristics[2];
				EnvironInterval = setInterval(function (){
					readEnvironment(peripheral,CloudAdaptor,DataWrapper,Humidity,Temperature,UVIndex,SensorDetails)
				},5000);
				
			});
			
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