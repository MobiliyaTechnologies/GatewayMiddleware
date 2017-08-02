var config = {
KafkaServerIP:"52.184.198.111",
KafkaServerPort:"2181",
OnboardSensorIP:"52.184.198.111",
GatewayID:12345,
KafkaTopic:"intel",
KafkaPartitionNumber:0,
GatewayTimezone:"Asia/Kolkata",
Latitude:18.5521273,
Longitude:73.7917362,
ContinuousBLEConnection:0,	//0: Connect at intervals, 1: Continuous connection
SimultaneousBLEConnections:4,
BLEConnectionDuration:3500,
BLEReconnectionInterval:4500
};
module.exports = config;
