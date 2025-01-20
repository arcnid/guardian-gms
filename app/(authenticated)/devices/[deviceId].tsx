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
	ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { UserDeviceService } from "@/services/userDevice/service";
import BackButton from "@/components/BackButton";
import { RecentSensorData } from "@/components/devices/RecentSensorData";
import { SensorChart } from "@/components/devices/SensorChart";
import { RelayControls } from "@/components/devices/RelayControls";

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
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [latestTempHumid, setLatestTempHumid] = useState<any>(null);
	const [deviceImageUri, setDeviceImageUri] = useState<string | null>(null);

	// Image upload state
	const [uploadingImage, setUploadingImage] = useState(false);

	// Function to handle image selection and upload
	const handleImageUpload = async () => {
		try {
			// Request media library permissions if not already granted
			const permissionResult =
				await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (permissionResult.status !== "granted") {
				alert("Permission to access media library is required!");
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.5,
			});

			if (!result.canceled && result.assets?.length > 0) {
				// Get the selected image URI
				const imageUri = result.assets[0].uri;
				console.log("Selected image URI:", imageUri);

				// Fetch the image file as a Blob
				const response = await fetch(imageUri);
				const imageData = await response.blob();
				console.log("Fetched image blob:", imageData);

				setUploadingImage(true);

				// Upload the image Blob to the backend
				await UserDeviceService.updateDeviceImage(
					deviceId as string,
					imageData
				);
				console.log("Image uploaded successfully.");

				// Fetch the updated image URL from the backend
				const updatedImageUrl = await UserDeviceService.getDeviceImageUrl(
					deviceId as string
				);
				console.log("Updated image URL:", updatedImageUrl);

				// Update the deviceImageUri state with the new image URL
				setDeviceImageUri(updatedImageUrl);

				// Optionally, update deviceData.devicePicture if needed
				setDeviceData((prev) =>
					prev ? { ...prev, devicePicture: updatedImageUrl } : prev
				);
			}
		} catch (e) {
			console.error("Error uploading image:", e);
			alert("Failed to upload image. Please try again.");
		} finally {
			setUploadingImage(false);
		}
	};

	const getLatestTempHumid = useCallback(async () => {
		if (!deviceId) {
			console.log("Device ID not found");
			return;
		}

		try {
			const fetchedLogs = await UserDeviceService.getLatestTemp(
				deviceId as string
			);
			if (fetchedLogs && fetchedLogs.length > 0) {
				setLatestTempHumid(fetchedLogs[0]);
				console.log("Latest temp and humid data:", fetchedLogs[0]);
			} else {
				setLatestTempHumid(null);
				console.log("No temp and humid data found.");
			}
		} catch (e) {
			console.error("Error fetching recent logs:", e);
			setError("Error fetching recent logs.");
		}
	}, [deviceId]);

	const getDeviceInfo = useCallback(async () => {
		if (!deviceId) {
			setError("Device ID not found");
			setLoading(false);
			return;
		}

		try {
			const data = await UserDeviceService.getDevice(deviceId as string);
			setDeviceData(data);
			console.log("Device data fetched:", data);

			// Fetch and set the existing image URI if available
			if (data) {
				const url = await UserDeviceService.getDeviceImageUrl(
					deviceId as string
				);
				console.log("Setting device image URI:", url);
				setDeviceImageUri(url as any);
			} else {
				setDeviceImageUri(null);
				console.log("No device picture available.");
			}
		} catch (e) {
			console.error("Error fetching device data:", e);
			setError("Error fetching device data.");
		} finally {
			setLoading(false);
		}
	}, [deviceId]);

	const getRecentLogs = useCallback(async () => {
		if (!deviceId) return;

		try {
			const fetchedLogs = await UserDeviceService.getRecentLogs(
				deviceId as string
			);
			setLogs(fetchedLogs);
			console.log("Recent logs fetched:", fetchedLogs);
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
	}, [getLatestTempHumid]);

	// Debugging: Log deviceImageUri on render
	useEffect(() => {
		console.log("Current deviceImageUri:", deviceImageUri);

		if (deviceImageUri == null) {
			//dont even try to show image
		}
	}, [deviceImageUri]);

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<Text style={styles.loadingText}>Loading...</Text>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={styles.container}>
				<Text style={styles.errorText}>{error}</Text>
			</SafeAreaView>
		);
	}

	if (!deviceData) {
		return (
			<SafeAreaView style={styles.container}>
				<Text style={styles.errorText}>No device data found.</Text>
			</SafeAreaView>
		);
	}

	const isRelay = deviceData.device_type.toLowerCase() === "relay";
	const isSensor = deviceData.device_type.toLowerCase() === "sensor";

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View>
					<BackButton label="Devices" />
				</View>

				{/* Device Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={handleImageUpload} activeOpacity={0.7}>
						{deviceImageUri ? (
							<Image
								source={{
									uri: deviceImageUri,
								}}
								style={styles.deviceImage}
								resizeMode="cover"
								onError={(error) => {
									console.error(
										"Error loading image:",
										error.nativeEvent.error
									);
									// Optionally, set a fallback image or remove the URI
									setDeviceImageUri(null);
								}}
							/>
						) : (
							<View style={styles.addImageContainer}>
								{uploadingImage ? (
									<ActivityIndicator size="small" color="#71A12F" />
								) : (
									<>
										<FontAwesome5 name="camera" size={24} color="#555" />
									</>
								)}
							</View>
						)}
					</TouchableOpacity>
					<View style={styles.deviceInfo}>
						<Text style={styles.deviceName}>{deviceData.device_name}</Text>
						<Text
							style={[
								styles.deviceStatus,
								{
									color: deviceData.status === "Online" ? "#4CAF50" : "#F44336",
								},
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

				<View style={styles.lastCommunication}>
					<MaterialIcons name="access-time" size={20} color="#555" />
					<Text style={styles.lastCommText}>
						Last Communication:{" "}
						{new Date(deviceData.added_at).toLocaleString() || "N/A"}
					</Text>
				</View>

				{isRelay && <RelayControls deviceId={deviceId}></RelayControls>}

				{isSensor && (
					<>
						<RecentSensorData
							temp={latestTempHumid?.temp_sensor_reading}
							humid={latestTempHumid?.humid_sensor_reading}
						/>
						<SensorChart logs={logs} deviceId={deviceId as any} />
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 30,
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
	addImageContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#E0E0E0",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
		flexDirection: "column",
	},
	addImageText: {
		color: "#555",
		fontSize: 12,
		textAlign: "center",
		marginTop: 5,
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
