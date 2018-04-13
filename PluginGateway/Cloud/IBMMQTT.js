var mqtt = require('mqtt')
var config = require('../../config');
var bus = require('../../eventbus');
let appInsights = require('applicationinsights');
let appInsightsClient = appInsights.client;
//var jData = '{"temp":17,"humidity":55,"location":{"longitude":-98.49,"latitude":29.42}}'
var socket;

function IBMMQTT () {};

IBMMQTT.prototype.IBMClientStop = function (cb) {
    console.log("IBM client stop call");
    if(socket != undefined && socket != null) {
        socket.end(function(err) {
            if(err) {
              console.log("Error in closing IBM MQTT client");
              console.log(err);
				      appInsightsClient.trackException(err);
            }
		        cb();
	      });
    }
};

IBMMQTT.prototype.IBMClientInit = function (cb) {
	  console.log("IBMMQTT.prototype.IBMClientInit");
	  bus.emit('log','Initiating IBM MQTT Adapter');
	  try {
        connectWSClient(cb);
	  } catch(error) {
		    console.log("IBM client init error: ", error);
				appInsightsClient.trackException(error);
	  }
};

function connectWSClient(cb) {
    socket = mqtt.connect('ws://xpkjzo.messaging.internetofthings.ibmcloud.com:1883', 
      {clientId:config.IBMclientId, username:config.IBMusername, password:config.IBMpassword});

    //socket.subscribe('iot-2/type/RoomSensor/id/F1RIOT1/evt/update/fmt/json');
    //socket.unsubscribe('/' + deviceUuid + '/events');
		//socket.publish('iot-2/type/RoomSensor/id/F1RIOT1/evt/SensorTag/fmt/json', '{"d":' + json_data +'}');	
		
    socket.on('message', function(topic, payload) {
        cb("message");
        console.log('IBM client message from:', topic);
    });

    socket.on('error', function(error) {
        cb("error");
        console.log('IBM client error', error);
    });

    socket.on('close', function() {
        cb("close");
        console.log('IBM client close');
        bus.emit('log','IBM MQTT client closed');
    });

    socket.on('offline', function() {
        cb("offline");
        console.log('IBM client offline');
    });

    socket.on('connect', function() {
        console.log('IBM client connected');
        bus.emit('log','IBM MQTT client connected');
        cb("connect");
    });
}

IBMMQTT.prototype.IBMHandler= function(json_data) {
    console.log("IBMMQTT.prototype.IBMHandler called");
    if(socket != undefined && socket != null) {
        socket.publish('iot-2/type/RoomSensor/id/F1RIOT1/evt/SensorTag/fmt/json', '{"d":' + json_data+'}');
		    console.log('IBM client Publish MQTT json_data', '{"d":' + json_data+'}');
    }
};

module.exports = IBMMQTT;