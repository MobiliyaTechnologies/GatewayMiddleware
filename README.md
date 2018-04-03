# Gateway Middleware:
	This project will include middleware solution which would be running on the Gateway Hardware.
	This middleware will connect to sensors and pass sensor data to IoT hub.

## Supported Hardware
- Dell Gateway

## How to Install
1. Install node and dependent libraries, test the bluetooth hardware for BLE functionality

## Pre-Requisites
* node v6.9+

```
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```
* dpkg-modules(for linux only) - libbluetoothdev,bluez,bluetooth

## Dependencies
* node-modules - noble,moment-timezone,kafka-node

## Hardware
* Comaptible Hardware Bluetooth 4.0+
* Successful Binding on bluetooth-hci-socket

## Run the App
* to run the app
```sudo node main.js```

## References
https://github.com/sandeepmistry/noble