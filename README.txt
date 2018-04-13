#Gateway Middleware:
	This project will include middleware solution which would be running on the Gateway Hardware. This will include all the high 
	level Details. Gateway acts as a middleware between sensor devices and azure iothub. SensorTag2650 and Bosch-XDK sensors are 
	currently supported via plugins. 
## Supported Hardware
- Dell Gateway
## Supported Devices
- SensorTag2650
- Bosch-XDK
## How to Install
1. Install node and dependent libraries, test the bluetooth hardware for BLE functionality
## Pre-Requisites
* node v6.9+
```
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```
* dpkg-modules(for linux only) - libbluetoothdev,bluez,bluetooth

Follow admin guide for more details.

## Dependencies
* node-modules - noble,electron,azure-iothub,express

## Hardware
* Comaptible Hardware Bluetooth 4.0+
* Successful Binding on bluetooth-hci-socket

## Run the App
* to run the app
```
electron app.js
```
## New Plugins
- To use other sensors with Gateway, create plugin to get data from sensor and add it to PluginGateway directory.

## References
https://github.com/sandeepmistry/noble