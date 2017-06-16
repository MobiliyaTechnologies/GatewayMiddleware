function SensorTag1350 () { };//class for SensorTag1350
SensorTag1350.prototype.SensorTagHandle1350 = function (peripheral,CloudAdaptor,DataWrapper, SensorDetails){ // sensor tag 1350 handle
	peripheral.connect(function(error) { //connect
		console.log('connected to peripheral: '	+ peripheral.uuid);
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
			var TemperatureService = services[4];
			TemperatureService.discoverCharacteristics(null,function(error,characteristics) { // characteristic discovery
				console.log('discovered the following characteristics:');
				for ( var i in characteristics) {
					console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
				}
			});
			
			TemperatureService.once('characteristicsDiscover', function(characteristics){ // on characteristic discover
				var startSamplingTemperatureData = characteristics[1];
				var notifyServiceTemperatureData = characteristics[0];
				//	notifyServiceAccelerometerData.setMaxListeners(100);
				
				notifyServiceTemperatureData.on('data', function(data,isNotification) { // notification events form temperature service
					//var dataLSB = data.readUInt8BE(1);
					//var dataMSB0 = data.readUInt8BE(2);
					//var dataMSB1 = data.readUInt8BE(3);
					//console.log(data);
					
					var capId = 0;
					for(var item in SensorDetails.SensorCapabilities) {
						if(SensorDetails.SensorCapabilities[item].Name == "Temperature") {
							capId = SensorDetails.SensorCapabilities[item].Id;
						}
					}
					
					// formatting data in degree celsius in SI units
					var json_data = {SensorKey:SensorDetails.SensorKey,CapabilityId:capId,GroupId:SensorDetails.GroupId,timestamp: new Date(),Temperature:(data.readUInt16LE(2,3)/128.0)};
					
					console.log("SensorTag1350 Temperature",data.readUInt16LE(2,3)/128.0);
					CloudAdaptor(DataWrapper(peripheral.id,"SensorTag1350","Temperature",json_data)); // pushing the data to cloud
				});
				
				var writeData = new Buffer([0x01]);
				notifyServiceTemperatureData.subscribe(function(error) { // enabling notifications for temperature service
					console.log('Subscription for notification enabled ',error);
					notifyServiceTemperatureData.notify(true, function(){ // starting notifications
						startSamplingTemperatureData.write(new Buffer(writeData),false,function(error) { //writing data to start notifications
							console.log('starting Temperature Sampling',error);
						});
					});
				});
			});
		});
	});
};
module.exports = SensorTag1350;