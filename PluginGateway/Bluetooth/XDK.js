function XDK () { };//class for XDK
XDK.prototype.XDKHandle = function (peripheral,CloudAdaptor,DataWrapper){// XDK handle
	peripheral.connect(function(error) {
		process.on('SIGINT', function() {
			console.log("Caught interrupt signal");
			peripheral.disconnect(function(error){
				console.log(peripheral.uuid + " Disconnected")
			});
			if(i_should_exit)
					process.exit();
		});
		console.log('connected to peripheral: '	+ peripheral.uuid);
		 
		peripheral.discoverServices(null,function(error, services) {// service discovery
			console.log('discovered the following services:');
			for ( var i in services) {
				console.log('  '+ i	+ ' uuid: '	+ services[i].uuid);
			}
		});
		peripheral.once('servicesDiscover', function(services){//on service discovery
			var AccelerometerService = services[2];
		
			AccelerometerService.discoverCharacteristics(null,function(error,characteristics) {// characteristic discovery
				console.log('discovered the following characteristics:');
				for ( var i in characteristics) {
					console.log('  '+ i	+ ' uuid: '	+ characteristics[i].uuid);
				}
			});
	
			AccelerometerService.once('characteristicsDiscover', function(characteristics){// on characteristic discover
				var startSamplingAccelerometerData = characteristics[0];
				var notifyServiceAccelerometerData = characteristics[1];
				notifyServiceAccelerometerData.on('data', function(data,isNotification) {// notification events form acclerometer service
					var data = data.toString('utf-8');
					// The substituted value will be contained in the result variable
					var zValue = (data.split(' ')[2]).replace(/\0[\s\S]*$/g,'');// regular expression for handling the z value
					
					// formatting data in m/s square in SI units
					var json_XYZ = {x:(Math.floor(parseInt(data.split(' ')[0])/430)),y:(Math.floor(parseInt(data.split(' ')[1])/430)),z:(Math.floor(parseInt(zValue)/430))};

					// the value can be scaled as per the requirement by editing the above line 
					//var json_XYZ = {x:data.split(' ')[0],y:data.split(' ')[1],z:zValue}// formatting raw data 
					console.log("XDK Accelerometer Data-- data event> ",	data.toString('utf-8'));
					CloudAdaptor(DataWrapper(peripheral.id,"Bosch-XDK","Accelerometer",json_XYZ));// pushing the data to cloud
					//console.log(json_data);
				});
				//Writing data to the characteristic to start accelerometer sampling
				var writeData = new Buffer("7374617274","hex");
				notifyServiceAccelerometerData.subscribe(function(error) {// enabling notifications for accelrometer service
					console.log('Subscription for notification enabled ',error);
					notifyServiceAccelerometerData.notify(true, function(){// starting notifications
						startSamplingAccelerometerData.write(new Buffer(writeData),false,function(error) { //writing data to start notifications
							console.log('starting Accelerometer Sampling',error);
						});
					});
				});
			});
		});
	});
};
module.exports = XDK;