/*******************************************************************************
 * Copyright(c) 2017-2018 Mobiliya Technologies
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 *
 * @author: Tarun Navadiya, Mobiliya
 * @version: 1.03
 * @summary: 
 *******************************************************************************/

var kafka = require('kafka-node');
var config = require('../../config');
var Moment = require('moment-timezone');
function KafkaAdaptor(){ }; // class for kafka 
// pushing data to kafka server
var sender = function(payloads){
	producer.send(payloads, function (err, data) {
	if (err){
		console.log("Kafka Clinet Error :", err);
	}
	//console.log(data, payloads);
	console.log(data);
	});
};
// payload generator for kafka
var payloadGen = function(json_data,cb){
	payloads = [{ topic: config.KafkaTopic, messages: JSON.stringify(json_data) , partition: config.KafkaPartitionNumber }];
	//console.log(payloads);
	return cb(payloads);
};
// kafka handle for pushing cloud data
KafkaAdaptor.prototype.kafkaHandle = function (json_data){
	payloadGen(json_data,function(payloads){
		try{
			sender(payloads);
		}catch(err){
			setTimeout(function(){
				sender(payloads);
			},5000);
		}
	});
};
// kafka handle for instatiating producer
KafkaAdaptor.prototype.kafkaInit = function (cb){
	Producer = kafka.Producer;
	KeyedMessage = kafka.KeyedMessage;
	client = new kafka.Client(config.KafkaServerIP+":"+config.KafkaServerPort);
	producer = new Producer(client);
	console.log("Producer initialising", Moment.tz(config.GatewayTimezone).format().replace(/T/,' ').replace(/\+..+/,''))
	producer.on('ready',function(){
		console.log("producer initialised");
		cb();
	});
};
module.exports = KafkaAdaptor;
