import React, { useCallback } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { UserDeviceService } from "@/services/userDevice/service";

const DeviceScreen = () => {
	const { deviceId } = useLocalSearchParams();

	const getDeviceInfo = useCallback(async () => {
		UserDeviceService.getDevice(deviceId as string);
	}, []);

	// Mock data for the demo
	const mockDevice = {
		id: deviceId,
		deviceName: "Temperature Sensor 01",
		status: "Online", // "Online" or "Offline"
		deviceType: "Sensor", // "Sensor" or "Relay"
		devicePicture: "https://via.placeholder.com/150",
		lastCommunicationTime: "2024-06-12 12:45 PM",
		temperature: 23.5,
		humidity: 45,
		powerState: "On", // For Relay only
	};

	// Conditional rendering for Relay or Sensor
	const isRelay = mockDevice.deviceType === "Relay";
	const isSensor = mockDevice.deviceType === "Sensor";

	return (
		<View style={styles.container}>
			{/* Device Header */}
			<View style={styles.header}>
				<Image
					source={{ uri: mockDevice.devicePicture }}
					style={styles.deviceImage}
				/>
				<View style={styles.deviceInfo}>
					<Text style={styles.deviceName}>{mockDevice.deviceName}</Text>
					<Text
						style={[
							styles.deviceStatus,
							{ color: mockDevice.status === "Online" ? "green" : "red" },
						]}
					>
						{mockDevice.status}
					</Text>
					<Text style={styles.deviceType}>Type: {mockDevice.deviceType}</Text>
				</View>
			</View>

			{/* Last Communication Time */}
			<View style={styles.lastCommunication}>
				<MaterialIcons name="access-time" size={20} color="#555" />
				<Text style={styles.lastCommText}>
					Last Communication: {mockDevice.lastCommunicationTime}
				</Text>
			</View>

			{/* Device Specific Actions */}
			{isRelay && (
				<View style={styles.relayActions}>
					<Text style={styles.sectionHeader}>Power Control</Text>
					<TouchableOpacity
						style={[
							styles.powerButton,
							mockDevice.powerState === "On" ? styles.powerOn : styles.powerOff,
						]}
					>
						<Text style={styles.powerButtonText}>
							{mockDevice.powerState === "On" ? "Turn Off" : "Turn On"}
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{isSensor && (
				<View style={styles.sensorData}>
					<Text style={styles.sectionHeader}>Recent Sensor Data</Text>
					<View style={styles.sensorRow}>
						<MaterialIcons name="thermostat" size={30} color="#FF5722" />
						<Text style={styles.sensorValue}>
							Temperature: {mockDevice.temperature}°C
						</Text>
					</View>
					<View style={styles.sensorRow}>
						<FontAwesome5 name="water" size={30} color="#2196F3" />
						<Text style={styles.sensorValue}>
							Humidity: {mockDevice.humidity}%
						</Text>
					</View>
				</View>
			)}
		</View>
	);
};

// Styles
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
		padding: 20,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
		backgroundColor: "#FFF",
		padding: 15,
		borderRadius: 10,
		elevation: 3,
	},
	deviceImage: {
		width: 80,
		height: 80,
		borderRadius: 40,
		marginRight: 15,
	},
	deviceInfo: {
		flex: 1,
	},
	deviceName: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#333",
	},
	deviceStatus: {
		fontSize: 16,
		marginVertical: 5,
	},
	deviceType: {
		fontSize: 14,
		color: "#555",
	},
	lastCommunication: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	lastCommText: {
		fontSize: 14,
		color: "#555",
		marginLeft: 5,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
	},
	relayActions: {
		alignItems: "center",
		marginBottom: 30,
	},
	powerButton: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: "center",
	},
	powerOn: {
		backgroundColor: "#4CAF50",
	},
	powerOff: {
		backgroundColor: "#F44336",
	},
	powerButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "bold",
	},
	sensorData: {
		backgroundColor: "#FFF",
		padding: 15,
		borderRadius: 10,
		elevation: 3,
	},
	sensorRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
	},
	sensorValue: {
		fontSize: 16,
		color: "#333",
		marginLeft: 10,
	},
});

export default DeviceScreen;
