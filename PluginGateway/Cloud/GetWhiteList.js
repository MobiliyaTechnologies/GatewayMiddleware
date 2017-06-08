var config = require('../../config');
var http = require('http');
var fs = require('fs');
var getWhitelist = function getWhitelist(cb) {
	http.get({
		port:80,
        host: config.OnboardSensorIP,
        path: '/listonboardsensor'
    }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            // Data reception is done, do whatever with it!
            //console.log(body);
			fs.writeFile('whitelist.json', body, 'utf8', function(){
				console.log("Json retrived and wrote to file");
			});
			var content = JSON.parse(body);
			//console.log(content.data);
			if(content.data){
				var whitelistAddress = [];
				content.data.forEach(function(item){
					whitelistAddress.push(item.sserialno);
				});
				//console.log("Following whitelist address found :",whitelistAddress);
				return cb(whitelistAddress,content.data);
				//for (var i=0; j=content.data.length, i<j; i++){
				//	whitelistAddress += content.data[i].sserialno;
			}else{
				console.log("NO whitelisted sesnors found !, message is :",content.message)
			}
        });
    });
}
module.exports = getWhitelist;