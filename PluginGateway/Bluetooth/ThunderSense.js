function ThunderboardSense () { };
ThunderboardSense.prototype.ThunderboardSenseHandle = function (peripheral){
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
				});
				Luminescence.read(function(err,data){
					console.log("Light Data :", data.readUInt32LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","Luminescence",data.readUInt16LE()));
				});
				NoiseLevel.read(function(err,data){
					console.log("NoiseLevel Data :", data.readUInt16LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","NoiseLevel",data.readUInt16LE()));
				});
				Humidity.read(function(err,data){
					console.log("Humidty Data :", data.readUInt16LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","Humidty",data.readUInt16LE()));
				});
				Temperature.read(function(err,data){
					console.log("Temperature Data :", data.readUInt16LE());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","Temperature",data.readUInt16LE()));
				});
				UVIndex.read(function(err,data){
					console.log("UVIndex Data :", data.readUInt8());
					//kafkaHandle(JSON_data(peripheral.address,"ThunderboardSense","UVIndex",data.readUInt16LE()));
				});
			});		
		});
	});
}
module.exports = ThunderboardSense;