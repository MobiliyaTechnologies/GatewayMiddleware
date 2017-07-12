const WebSocket = require('ws');
var bus = require('./eventbus');

const wss = new WebSocket.Server({ port: 8080 });
console.log('Creating Websocket Server');

wss.on('connection', function connection(ws) {
	
  console.log('client connected');
  /*
  ws.on('message', function incoming(message) {
    //console.log('received: %s', message);
	
	// Broadcast to everyone else.
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  */
  //ws.send('client connected');
});

console.log('Creating Event Bus Client');
var logMessage = function (message) {
console.log('Log Message: ', message);
	if(wss != undefined) {
		// Broadcast to everyone else.
    wss.clients.forEach(function each(client) {
      if (client !== wss && client.readyState === WebSocket.OPEN) {
        console.log('SEND Message: ', message);
        client.send(message);
      }
    });
	}
};

bus.on('log', logMessage);