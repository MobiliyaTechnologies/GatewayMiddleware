var util = require('util');
var exec = require('child_process').exec;
var CloudLed = function CloudLed (cloudled){
	exec("echo "+ cloudled +" > /sys/class/gpio/gpio346/value",function(){
		console.log("Cloud Led :", cloudled);
	});
};

//function puts(error,stdout,stderr) {console.log(stdout)};

/*
function blink(){
	setTimeout(function(){exec("echo 0 > /sys/class/gpio/gpio346/value",puts)},1000);
	exec("echo 1 > /sys/class/gpio/gpio346/value",puts);
}
setInterval(function(){
	blink();
},2000);
*/
module.exports = CloudLed;