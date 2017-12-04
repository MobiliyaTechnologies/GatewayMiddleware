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
 * @author: Gaurav Wable, Mobiliya
 * @version: 1.03
 * @summary: Configuration parameters file
 *******************************************************************************/

var config = {
KafkaServerIP:"52.184.198.111",
KafkaServerPort:"2181",
OnboardSensorIP:"52.184.198.111",
GatewayID:12345,
KafkaTopic:"intel",
KafkaPartitionNumber:0,
GatewayTimezone:"Asia/Kolkata",
Latitude:47.6464737,
Longitude:-122.2090137,
GPSDataInterval:600000, //10 min
ContinuousBLEConnection:0,	//0: Connect at intervals, 1: Continuous connection
SimultaneousBLEConnections:4,
BLEConnectionDuration:3500,
BLEReconnectionInterval:5000,
Version:"1.05",
OpenElectronWindow:false
};
module.exports = config;
