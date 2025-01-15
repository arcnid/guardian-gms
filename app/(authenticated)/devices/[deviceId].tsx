// components/DeviceScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router"; // Keeping as per your request
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { UserDeviceService } from "@/services/userDevice/service";
import BackButton from "@/components/BackButton";
import { RecentSensorData } from "@/components/devices/RecentSensorData"; // Keeping as per your request
import { SensorChart } from "@/components/devices/SensorChart"; // Import the new SensorChart component
import { RelayControls } from "@/components/devices/RelayControls"; // Import the new RelayControls component

interface DeviceData {
	device_id: string;
	device_name: string;
	device_type: string;
	status: string;
	added_at: string;
	devicePicture: string;
	temperature: any;
	humidity: any;
}

interface LogEntry {
	id: number;
	created_at: string;
	temp_sensor_reading: number;
	humid_sensor_reading: number;
	// Other fields can be added if necessary
}

const DeviceScreen = () => {
	const { deviceId } = useLocalSearchParams();
	const [deviceData, setDeviceData] = useState<DeviceData>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]); // Define the type for logs
	const [latestTempHumid, setLatestTempHumid] = useState<any>(null);

	const getLatestTempHumid = useCallback(async () => {
		if (!deviceId) {
			console.log("device Id not found");
			return;
		} // Prevent fetching logs if deviceId is not available

		try {
			const fetchedLogs = await UserDeviceService.getLatestTemp(
				deviceId as string
			);
			console.log("Fetched latest temps:", fetchedLogs);

			setLatestTempHumid(fetchedLogs[0]);

			console.log("testing temps");
		} catch (e) {
			console.error("Error fetching recent logs:", e);
			throw new Error("Error fetching recent logs.");
		}
	}, [deviceId]);

	// Fetch device information
	const getDeviceInfo = useCallback(async () => {
		if (!deviceId) {
			setError("Device ID not found");
			setLoading(false);
			return;
		}

		try {
			const data = await UserDeviceService.getDevice(deviceId as string);
			console.log("Fetched device data:", data);
			setDeviceData(data);
		} catch (e) {
			console.error("Error fetching device data:", e);
			setError("Error fetching device data.");
		} finally {
			setLoading(false);
		}
	}, [deviceId]);

	// Fetch recent logs
	const getRecentLogs = useCallback(async () => {
		if (!deviceId) return; // Prevent fetching logs if deviceId is not available

		try {
			const fetchedLogs = await UserDeviceService.getRecentLogs(
				deviceId as string
			);
			console.log("Fetched recent logs:", fetchedLogs);
			setLogs(fetchedLogs);
		} catch (e) {
			console.error("Error fetching recent logs:", e);
			setError("Error fetching recent logs.");
		}
	}, [deviceId]);

	useEffect(() => {
		getDeviceInfo();
	}, [getDeviceInfo]);

	useEffect(() => {
		getRecentLogs();
	}, [getRecentLogs]);

	useEffect(() => {
		getLatestTempHumid();

		console.log("yo");

		console.log(latestTempHumid);
	}, [getLatestTempHumid]);

	// Handle loading state
	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<Text style={styles.loadingText}>Loading...</Text>
			</SafeAreaView>
		);
	}

	// Handle error state
	if (error) {
		return (
			<SafeAreaView style={styles.container}>
				<Text style={styles.errorText}>{error}</Text>
			</SafeAreaView>
		);
	}

	// Handle case where deviceData is not found
	if (!deviceData) {
		return (
			<SafeAreaView style={styles.container}>
				<Text style={styles.errorText}>No device data found.</Text>
			</SafeAreaView>
		);
	}

	// Determine device type
	const isRelay = deviceData.device_type.toLowerCase() === "relay";
	const isSensor = deviceData.device_type.toLowerCase() === "sensor";

	console.log("Look out for this", deviceId);

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View>
					<BackButton label="Devices" />
				</View>

				{/* Device Header */}
				<View style={styles.header}>
					<Image
						source={{
							uri:
								deviceData.devicePicture || "https://via.placeholder.com/150",
						}}
						style={styles.deviceImage}
					/>
					<View style={styles.deviceInfo}>
						<Text style={styles.deviceName}>{deviceData.device_name}</Text>
						<Text
							style={[
								styles.deviceStatus,
								{ color: deviceData.status === "Online" ? "green" : "red" },
							]}
						>
							{deviceData.status || "Unknown"}
						</Text>
						<Text style={styles.deviceType}>
							Type:{" "}
							{deviceData.device_type.charAt(0).toUpperCase() +
								deviceData.device_type.slice(1)}
						</Text>
					</View>
				</View>

				{/* Last Communication Time */}
				<View style={styles.lastCommunication}>
					<MaterialIcons name="access-time" size={20} color="#555" />
					<Text style={styles.lastCommText}>
						Last Communication:{" "}
						{new Date(deviceData.added_at).toLocaleString() || "N/A"}
					</Text>
				</View>

				{/* Device Specific Actions */}
				{isRelay && <RelayControls deviceId={deviceId}></RelayControls>}

				{isSensor && (
					<>
						<RecentSensorData
							temp={latestTempHumid?.temp_sensor_reading}
							humid={latestTempHumid?.humid_sensor_reading}
						/>
						<SensorChart logs={logs} deviceId={deviceId as any} />
						{/* Removed the {" "} to prevent stray string error */}
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

// Styles (with additions for relay power button states and error/loading texts)
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 30, // Extra padding to ensure content is above the tab bar
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
		paddingVertical: 20, // Increased size for a big button
		paddingHorizontal: 40,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 10,
	},
	powerOn: {
		backgroundColor: "#4CAF50", // Green for "On"
	},
	powerOff: {
		backgroundColor: "#F44336", // Red for "Off"
	},
	powerButtonText: {
		color: "#FFF",
		fontSize: 18,
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
	loadingText: {
		fontSize: 18,
		color: "#555",
		textAlign: "center",
		marginTop: 50,
	},
	errorText: {
		fontSize: 18,
		color: "red",
		textAlign: "center",
		marginTop: 50,
	},
});

export default DeviceScreen;
