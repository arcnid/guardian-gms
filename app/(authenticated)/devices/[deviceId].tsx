import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	ScrollView,
	ActivityIndicator,
	RefreshControl,
	Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { UserDeviceService } from "@/services/userDevice/service";
import BackButton from "@/components/BackButton";
import { RecentSensorData } from "@/components/devices/RecentSensorData";
import { SensorChart } from "@/components/devices/SensorChart";
import { RelayControls } from "@/components/devices/RelayControls";
import mime from "mime";

// =============================
// Helper: Determine the MIME type from the file extension.
// =============================
const getMimeType = (uri: string): string => {
	if (uri.toLowerCase().endsWith(".png")) {
		return "image/png";
	}
	// Default to JPEG.
	return "image/jpeg";
};

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
	// Other fields if needed...
}

const DeviceScreen = () => {
	const { deviceId } = useLocalSearchParams();
	const router = useRouter();

	const [deviceData, setDeviceData] = useState<DeviceData>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [latestTempHumid, setLatestTempHumid] = useState<any>(null);
	const [deviceImageUri, setDeviceImageUri] = useState<string | null>(null);

	// Image upload state.
	const [uploadingImage, setUploadingImage] = useState(false);
	// New state to track when the image is loading.
	const [imageLoading, setImageLoading] = useState(false);

	// Refresh state.
	const [refreshing, setRefreshing] = useState(false);
	const [refreshCounter, setRefreshCounter] = useState(0);

	// A cache-buster state that will be updated each time the screen is focused.
	const [cacheBuster, setCacheBuster] = useState(Date.now());

	// Update cacheBuster each time the screen is focused.
	useFocusEffect(
		useCallback(() => {
			setCacheBuster(Date.now());
		}, [])
	);

	// Compute a cache-busted image URL using the cacheBuster.
	const finalImageUrl = useMemo(() => {
		if (!deviceImageUri) return null;
		return `${deviceImageUri}?cb=${cacheBuster}`;
	}, [deviceImageUri, cacheBuster]);

	// Compute relay data (if applicable).
	const relayData = useMemo(() => {
		if (logs.length > 0) {
			const lastLog = logs[0];
			const logTime = new Date(lastLog.created_at);
			const now = new Date();
			const diffInMs = now.getTime() - logTime.getTime();
			const online = diffInMs <= 60000;
			let relayState = false;
			if (lastLog.relay_state === "on") {
				relayState = true;
			} else if (lastLog.relay_state === "off") {
				relayState = false;
			}
			return { online, relayState };
		}
		return { online: false, relayState: false };
	}, [logs]);

	/**
	 * Handle image selection and upload.
	 */
	const handleImageUpload = async () => {
		try {
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
				const imageUri = result.assets[0].uri;
				// Correct the URI on Android.
				const newImageUri =
					Platform.OS === "android"
						? "file:///" + imageUri.split("file:/").join("")
						: imageUri;

				// Build the FormData using the mime package.
				const formData = new FormData();
				formData.append("image", {
					uri: newImageUri,
					type: mime.getType(newImageUri) || getMimeType(newImageUri),
					name: newImageUri.split("/").pop() || "photo.jpg",
				});

				setUploadingImage(true);

				// Upload the image.
				await UserDeviceService.updateDeviceImage(deviceId as string, formData);

				// Retrieve the updated image URL.
				const updatedImageUrl = await UserDeviceService.getDeviceImageUrl(
					deviceId as string
				);
				setDeviceImageUri(updatedImageUrl);
				setDeviceData((prev) =>
					prev ? { ...prev, devicePicture: updatedImageUrl } : prev
				);
				// Refresh the cache buster to force the image to reload.
				setCacheBuster(Date.now());
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
			await UserDeviceService.getDeviceWithLatestLog(deviceId as string);
		} catch (e) {
			console.error(e);
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

			if (data) {
				const url = await UserDeviceService.getDeviceImageUrl(
					deviceId as string
				);
				console.log("Setting device image URI:", url);
				setDeviceImageUri(url);
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

	// Refresh handler.
	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await Promise.all([getDeviceInfo(), getRecentLogs(), getLatestTempHumid()]);
		setRefreshCounter((prev) => prev + 1);
		setRefreshing(false);
	}, [getDeviceInfo, getRecentLogs, getLatestTempHumid]);

	useEffect(() => {
		getDeviceInfo();
	}, [getDeviceInfo]);

	useEffect(() => {
		getRecentLogs();
	}, [getRecentLogs]);

	useEffect(() => {
		getLatestTempHumid();
	}, [getLatestTempHumid]);

	// Compute displayed status based on the latest log timestamp.
	const displayStatus = useMemo(() => {
		if (logs.length > 0) {
			const lastLogTime = new Date(logs[0].created_at);
			const now = new Date();
			const diffInMs = now.getTime() - lastLogTime.getTime();
			return diffInMs <= 60000 ? "Online" : "Offline";
		}
		return deviceData?.status || "Unknown";
	}, [logs, deviceData]);

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
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				<View>
					<BackButton label="Devices" />
				</View>

				{/* Device Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={handleImageUpload} activeOpacity={0.7}>
						<View style={styles.imageContainer}>
							{finalImageUrl ? (
								<Image
									source={{ uri: finalImageUrl }}
									style={styles.deviceImage}
									resizeMode="cover"
									onLoadStart={() => setImageLoading(true)}
									onLoadEnd={() => setImageLoading(false)}
									onError={() => setDeviceImageUri(null)}
								/>
							) : (
								<View style={styles.addImageContainer}>
									{uploadingImage ? (
										<ActivityIndicator size="small" color="#71A12F" />
									) : (
										<FontAwesome5 name="camera" size={24} color="#555" />
									)}
								</View>
							)}
							{finalImageUrl && imageLoading && (
								<View style={styles.imageOverlay}>
									<ActivityIndicator size="small" color="#71A12F" />
								</View>
							)}
						</View>
					</TouchableOpacity>
					<View style={styles.deviceInfo}>
						<Text style={styles.deviceName}>{deviceData.device_name}</Text>
						<Text
							style={[
								styles.deviceStatus,
								{ color: displayStatus === "Online" ? "#4CAF50" : "#F44336" },
							]}
						>
							{displayStatus}
						</Text>
						<Text style={styles.deviceType}>
							Type:{" "}
							{deviceData.device_type.charAt(0).toUpperCase() +
								deviceData.device_type.slice(1)}
						</Text>
					</View>
				</View>

				{isRelay && (
					<RelayControls
						deviceId={deviceId}
						currentRelayState={relayData.relayState}
						online={relayData.online}
					/>
				)}
				{isSensor && (
					<>
						<RecentSensorData
							deviceId={deviceId as string}
							refreshCounter={refreshCounter}
						/>
						<SensorChart logs={logs} deviceId={deviceId as string} />
					</>
				)}

				<TouchableOpacity
					style={styles.deviceActions}
					onPress={() => {
						router.push("/settings/actions");
					}}
					activeOpacity={0.7}
				>
					<Text
						style={{
							fontSize: 20,
							fontWeight: "bold",
							marginBottom: 10,
							flex: 1,
						}}
					>
						Device Actions
					</Text>
					<MaterialIcons name="chevron-right" size={24} color="#555" />
				</TouchableOpacity>
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
	imageContainer: {
		position: "relative",
	},
	deviceActions: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
		backgroundColor: "#FFF",
		padding: 15,
		borderRadius: 10,
		elevation: 3,
		marginTop: 20,
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
	imageOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,0.7)",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 40,
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
