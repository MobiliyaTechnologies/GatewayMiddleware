const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log('Creating Websocket Server');

wss.on('connection', function connection(ws) {
	
  console.log('client connected');
  
  ws.on('message', function incoming(message) {
    //console.log('received: %s', message);
	
	// Broadcast to everyone else.
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  //ws.send('client connected');
});