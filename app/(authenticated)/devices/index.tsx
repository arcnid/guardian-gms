// app/(authenticated)/devices.js
import React, { useState, useContext, useCallback } from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	FlatList,
	SafeAreaView,
	Image,
	RefreshControl,
	ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { UserDeviceService } from "@/services/userDevice/service";
import { AuthContext } from "@/contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

interface Device {
	device_id: string;
	device_name: string | null;
	status: "Online" | "Offline" | string | undefined;
	device_type: "relay" | "sensor";
	image: string;
}

const DevicesScreen = () => {
	const router = useRouter();
	const [devices, setDevices] = useState<Device[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { userId } = useContext(AuthContext);

	console.log("user", userId);

	// Combined function to fetch devices and their images
	const fetchDevicesAndImages = useCallback(async () => {
		try {
			setError(null);
			setLoading(true);

			// Fetch devices associated with the user
			const deviceData = await UserDeviceService.getDevicesByUser(userId);
			console.log("Fetched Devices:", deviceData);

			if (!Array.isArray(deviceData)) {
				console.error(
					"Expected data to be an array but got:",
					typeof deviceData
				);
				setError("Invalid data format received.");
				setDevices([]);
				return;
			}

			if (deviceData.length === 0) {
				setDevices([]);
				return;
			}

			// Extract device IDs to fetch images
			const deviceIdList = deviceData.map((device) => device.device_id);
			console.log("Device IDs for image fetching:", deviceIdList);

			// Fetch images for the devices
			const devicesWithImages =
				await UserDeviceService.getDevicesWithImage(deviceIdList);
			console.log("Devices with Images Retrieved:", devicesWithImages);

			// Create a map of device_id to image URL
			const imageMap = new Map<string, string>();
			devicesWithImages.forEach((device) => {
				imageMap.set(device.device_id, device.image);
			});

			// Merge images into the device data
			const updatedDevices = deviceData.map((device) => ({
				...device,
				image: imageMap.get(device.device_id) || device.image || "",
			}));

			console.log("Updated Devices with Images:", updatedDevices);
			setDevices(updatedDevices);
		} catch (err) {
			console.error("Error fetching devices or images:", err);
			setError("Failed to fetch devices. Please try again.");
			setDevices([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [userId]);

	// Fetch devices and images on component mount and when userId changes
	useFocusEffect(
		useCallback(() => {
			fetchDevicesAndImages();
		}, [fetchDevicesAndImages])
	);

	// Handle device management navigation
	const handleManageDevice = (deviceId: string) => {
		console.log("Managing device with ID:", deviceId);
		router.push(`/devices/${deviceId}`);
	};

	// Handle pull-to-refresh
	const onRefresh = () => {
		setRefreshing(true);
		fetchDevicesAndImages();
	};

	// Render each device item
	const renderDevice = ({ item }: { item: Device }) => {
		console.log("Rendering device:", item);
		const displayName = item.device_name ? item.device_name : item.device_id;

		return (
			<TouchableOpacity
				style={styles.deviceCard}
				onPress={() => handleManageDevice(item.device_id)}
				activeOpacity={0.8}
			>
				<View style={styles.deviceInfo}>
					{item.image ? (
						<Image source={{ uri: item.image }} style={styles.deviceImage} />
					) : (
						<View style={[styles.deviceImage, styles.placeholderImage]}>
							<MaterialIcons name="device-hub" size={24} color="#FFFFFF" />
						</View>
					)}
					<View style={styles.deviceTextContainer}>
						<Text style={styles.deviceName}>{displayName}</Text>
						<View style={styles.statusContainer}>
							<MaterialIcons
								name={
									item.status === "Online" ? "check-circle" : "highlight-off"
								}
								size={16}
								color={item.status === "Online" ? "#4CAF50" : "#F44336"}
							/>
							<Text
								style={[
									styles.deviceStatus,
									{ color: item.status === "Online" ? "#4CAF50" : "#F44336" },
								]}
							>
								{item.status === "Online" ? "Online" : "Offline"}
							</Text>
						</View>
					</View>
				</View>
				<MaterialIcons name="more-horiz" color="#71A12F" size={24} />
			</TouchableOpacity>
		);
	};

	// Show loading indicator while fetching data
	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				{/* Header */}
				<View style={styles.headerContainer}>
					<Text style={styles.headerTitle}>My Devices</Text>
					<TouchableOpacity
						onPress={() => router.push("/add-device")}
						style={styles.addButton}
					>
						<MaterialIcons name="add" size={24} color="#fff" />
					</TouchableOpacity>
				</View>
				{/* Loading Indicator */}
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#71A12F" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>My Devices</Text>
				<TouchableOpacity
					onPress={() => router.push("/add-device")}
					style={styles.addButton}
				>
					<MaterialIcons name="add" size={24} color="#fff" />
				</TouchableOpacity>
			</View>

			{/* Handle Error */}
			{error && (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			)}

			{/* Device List */}
			<FlatList
				data={devices}
				keyExtractor={(item) => item.device_id}
				renderItem={renderDevice}
				contentContainerStyle={styles.listContent}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>
							There are no devices associated with your account. Please add one
							to get started.
						</Text>
					</View>
				)}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			/>
		</SafeAreaView>
	);
};

export default DevicesScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 10,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E0E0E0",
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
	},
	addButton: {
		backgroundColor: "#71A12F",
		borderRadius: 20,
		padding: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	listContent: {
		padding: 16,
		paddingBottom: 30,
	},
	deviceCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		padding: 15,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	deviceInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	deviceImage: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "#E0E0E0",
		marginRight: 15,
	},
	placeholderImage: {
		backgroundColor: "#BDBDBD",
		justifyContent: "center",
		alignItems: "center",
	},
	deviceTextContainer: {
		flex: 1,
	},
	deviceName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
	},
	statusContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
	deviceStatus: {
		fontSize: 14,
		marginLeft: 4,
	},
	separator: {
		height: 16,
	},
	emptyContainer: {
		alignItems: "center",
		marginTop: 50,
		paddingHorizontal: 20,
	},
	emptyText: {
		fontSize: 16,
		color: "#888",
		textAlign: "center",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	errorContainer: {
		padding: 16,
		backgroundColor: "#F8D7DA",
		borderRadius: 8,
		margin: 16,
	},
	errorText: {
		color: "#721C24",
		textAlign: "center",
	},
});
