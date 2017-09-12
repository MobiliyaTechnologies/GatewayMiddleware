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
ContinuousBLEConnection:0,	//0: Connect at intervals, 1: Continuous connection
SimultaneousBLEConnections:4,
BLEConnectionDuration:3500,
BLEReconnectionInterval:5000,
Version:"1.02"
};
module.exports = config;
