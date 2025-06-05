// export default App;

import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { accelerometer, gyroscope, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import dgram from 'react-native-udp';

// Set update frequency (in milliseconds)
setUpdateIntervalForType(SensorTypes.accelerometer, 100);
setUpdateIntervalForType(SensorTypes.gyroscope, 100);

const serverIP = "192.168.1.100"; // Change this to your laptop's local IP
const serverPort = 6000;

const socket = dgram.createSocket({ type: 'udp4', reusePort: true });

// Bind the socket before sending
socket.bind(serverPort);


const App = () => {
    const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
    const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        const accelSubscription = accelerometer.subscribe(({ x, y, z }) => {
            setAccelData({ x, y, z });
            const message = `ACCEL,${x},${y},${z}`;
            socket.send(message, undefined, undefined, serverPort, serverIP);
        });

        const gyroSubscription = gyroscope.subscribe(({ x, y, z }) => {
            setGyroData({ x, y, z });
            const message = `GYRO,${x},${y},${z}`;
            socket.send(message, undefined, undefined, serverPort, serverIP);
        });

        return () => {
            accelSubscription.unsubscribe();
            gyroSubscription.unsubscribe();
        };
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Accelerometer: X: {accelData.x.toFixed(2)}, Y: {accelData.y.toFixed(2)}, Z: {accelData.z.toFixed(2)}</Text>
            <Text>Gyroscope: X: {gyroData.x.toFixed(2)}, Y: {gyroData.y.toFixed(2)}, Z: {gyroData.z.toFixed(2)}</Text>
        </View>
    );
};

export default App;
