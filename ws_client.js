const WebSocket = require('ws');
var bus = require('./eventbus');

console.log('Creating Websocket Client');
var logMessage = function (message) {
console.log('Log Message: ', message);
	if(ws != undefined) {
		ws.send(message);	
	}
}

bus.on('log', logMessage);

const ws = new WebSocket('ws://127.0.0.1:8080/');
//console.log('client 2');
ws.on('open', function open() {
  console.log('websocket server connection opened');
  //console.log('send: something');
  //ws.send('something');
});
/*
ws.on('message', function incoming(data) {
  console.log('client received: %s', data);
});
*/