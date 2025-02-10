// app/(authenticated)/dashboard.js
import React, { useContext, useState, useCallback, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Image,
	RefreshControl,
	ActivityIndicator,
	Modal,
	Animated,
} from "react-native";
import { AuthContext } from "@/contexts/AuthContext"; // Adjust the path if necessary
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserDeviceService } from "@/services/userDevice/service";
import { useFocusEffect } from "@react-navigation/native";

const DashboardScreen = () => {
	const { logout, userId } = useContext(AuthContext);
	const router = useRouter();

	const [devices, setDevices] = useState([]); // State to hold devices
	const [refreshing, setRefreshing] = useState(false);
	const [loading, setLoading] = useState(true); // Loading state
	const [error, setError] = useState(null); // Error state
	const [modalVisible, setModalVisible] = useState(false); // Modal visibility
	const [fadeAnim] = useState(new Animated.Value(0)); // Animation value

	// Function to handle logout
	const handleLogout = async () => {
		await logout(); // Clear authentication state
		router.replace("/login"); // Redirect to Login screen
	};

	// Function to handle profile navigation
	const handleProfile = () => {
		router.push(`/dashboard/users/${userId}`); // Navigate to the Profile screen with userId
	};

	// Updated function to fetch devices along with their images and status
	const getDeviceList = useCallback(async () => {
		try {
			setError(null);
			setLoading(true);

			// 1. Fetch devices associated with the user
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

			// 2. Fetch images for the devices
			const deviceIdList = deviceData.map((device) => device.device_id);
			console.log("Device IDs for image fetching:", deviceIdList);

			const devicesWithImages =
				await UserDeviceService.getDevicesWithImage(deviceIdList);
			console.log("Devices with Images Retrieved:", devicesWithImages);

			// Create a map of device_id to image URL
			const imageMap = new Map();
			devicesWithImages.forEach((device) => {
				imageMap.set(device.device_id, device.image);
			});

			// Merge images into the device data
			const updatedDevices = deviceData.map((device) => ({
				...device,
				image: imageMap.get(device.device_id) || device.image || "",
			}));

			// 3. For each device, fetch its most recent log to compute its status.
			const devicesWithStatus = await Promise.all(
				updatedDevices.map(async (device) => {
					try {
						const logs = await UserDeviceService.getRecentLogs(
							device.device_id
						);
						if (logs && logs.length > 0) {
							const lastLogTime = new Date(logs[0].created_at);
							const now = new Date();
							const diffInMs = now.getTime() - lastLogTime.getTime();
							// If the latest log is within 60 seconds, mark it as Online
							return {
								...device,
								status: diffInMs <= 60000 ? "Online" : "Offline",
							};
						} else {
							return { ...device, status: "Offline" };
						}
					} catch (logError) {
						console.error(
							`Error fetching logs for device ${device.device_id}:`,
							logError
						);
						return { ...device, status: "Offline" };
					}
				})
			);

			console.log("Updated Devices with Images and Status:", devicesWithStatus);
			setDevices(devicesWithStatus);
		} catch (err) {
			console.error("Error fetching devices or images:", err);
			setError("Failed to fetch devices. Please try again.");
			setDevices([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [userId]);

	// Fetch devices when the screen is focused
	useFocusEffect(
		useCallback(() => {
			getDeviceList();
		}, [getDeviceList])
	);

	// Handle pull-to-refresh
	const onRefresh = () => {
		setRefreshing(true);
		getDeviceList();
	};

	// Show modal if no devices
	useEffect(() => {
		if (!loading && devices.length === 0) {
			setModalVisible(true);
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();
		} else {
			setModalVisible(false);
			fadeAnim.setValue(0);
		}
	}, [loading, devices, fadeAnim]);

	// Mock data for summary cards updated based on fetched devices
	const summaryData = [
		{
			id: "1",
			title: "Devices",
			count: devices.length.toString(),
			icon: "devices",
			color: "#71A12F",
		},
		{
			id: "2",
			title: "Online",
			count: devices
				.filter((device) => device.status === "Online")
				.length.toString(),
			icon: "check-circle",
			color: "#4CAF50",
		},
		{
			id: "3",
			title: "Offline",
			count: devices
				.filter((device) => device.status === "Offline")
				.length.toString(),
			icon: "highlight-off",
			color: "#F44336",
		},
	];

	// Handle device management navigation
	const handleManageDevice = (deviceId) => {
		console.log("Managing device with ID:", deviceId);
		// Navigate to a device management screen
		router.push(`/devices/${deviceId}`);
	};

	// Render each device item (optional, can be removed if not needed on dashboard)
	const renderDevice = ({ item }) => {
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

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>Dashboard</Text>
				<TouchableOpacity onPress={handleProfile} style={styles.profileButton}>
					<MaterialIcons name="account-circle" size={30} color="#71A12F" />
				</TouchableOpacity>
			</View>

			{/* Regular Dashboard Content */}
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				<Text style={styles.welcomeText}>Welcome, User!</Text>

				<View style={styles.summaryContainer}>
					{summaryData.map((item) => (
						<View key={item.id} style={styles.summaryCard}>
							<MaterialIcons name={item.icon} size={30} color={item.color} />
							<Text style={styles.summaryCount}>{item.count}</Text>
							<Text style={styles.summaryTitle}>{item.title}</Text>
						</View>
					))}
				</View>

				{devices.length > 0 && (
					<View style={styles.featuredCard}>
						<Text style={styles.featuredTitle}>Featured Device</Text>
						<View style={styles.featuredContent}>
							<Image
								source={{
									uri: devices[0].image || "https://via.placeholder.com/100",
								}}
								style={styles.deviceImage}
							/>
							<View style={styles.deviceInfo}>
								<Text style={styles.deviceName}>
									{devices[0].device_name || devices[0].device_id}
								</Text>
								<Text style={styles.deviceStatus}>
									{devices[0].status || "Unknown"}
								</Text>
							</View>
						</View>
					</View>
				)}

				<TouchableOpacity
					onPress={handleLogout}
					style={styles.logoutButtonBottom}
				>
					<Text style={styles.buttonText}>Log Out</Text>
				</TouchableOpacity>
			</ScrollView>

			{/* Modal for No Devices */}
			<Modal
				transparent={true}
				visible={modalVisible}
				animationType="fade"
				onRequestClose={() => setModalVisible(false)}
			>
				<Animated.View style={[styles.modalBackground, { opacity: fadeAnim }]}>
					<View style={styles.modalContainer}>
						<MaterialIcons name="device-hub" size={60} color="#71A12F" />
						<Text style={styles.modalTitle}>No Devices Found</Text>
						<Text style={styles.modalSubtitle}>
							It looks like you don't have any devices yet. Let's set one up to
							get started!
						</Text>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								onPress={() => {
									setModalVisible(false);
									router.push("/add-device");
								}}
								style={styles.modalButtonPrimary}
							>
								<Text style={styles.modalButtonPrimaryText}>Add Device</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => setModalVisible(false)}
								style={styles.modalButtonSecondary}
							>
								<Text style={styles.modalButtonSecondaryText}>Later</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Animated.View>
			</Modal>

			{/* Loading Indicator Overlay */}
			{loading && (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="large" color="#71A12F" />
				</View>
			)}

			{/* Error Message Overlay */}
			{error && (
				<View style={styles.errorOverlay}>
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>{error}</Text>
						<TouchableOpacity
							onPress={getDeviceList}
							style={styles.retryButton}
						>
							<Text style={styles.retryButtonText}>Retry</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}
		</SafeAreaView>
	);
};

export default DashboardScreen;

// Stylesheet
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5", // Match the layout background
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
	profileButton: {
		padding: 5,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 30, // Extra padding to ensure content is above the tab bar
	},
	welcomeText: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 20,
		color: "#333",
		alignSelf: "center",
	},
	summaryContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	summaryCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		padding: 20,
		alignItems: "center",
		flex: 1,
		marginHorizontal: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	summaryCount: {
		fontSize: 24,
		fontWeight: "bold",
		marginTop: 10,
		color: "#333",
	},
	summaryTitle: {
		fontSize: 14,
		color: "#666",
		marginTop: 5,
	},
	featuredCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	featuredTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
	},
	featuredContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	deviceImage: {
		width: 60,
		height: 60,
		borderRadius: 30,
		marginRight: 15,
	},
	deviceInfo: {
		flex: 1,
	},
	deviceTextContainer: {
		flex: 1,
	},
	deviceName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
	},
	deviceStatus: {
		fontSize: 14,
		color: "#888",
	},
	logoutButtonBottom: {
		backgroundColor: "#71A12F",
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 10,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
	// Modal Styles
	modalBackground: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		width: "80%",
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 30,
		alignItems: "center",
		elevation: 5,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#333",
		marginTop: 20,
		textAlign: "center",
	},
	modalSubtitle: {
		fontSize: 16,
		color: "#666",
		marginTop: 10,
		textAlign: "center",
	},
	modalButtons: {
		flexDirection: "row",
		marginTop: 30,
	},
	modalButtonPrimary: {
		backgroundColor: "#71A12F",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginRight: 10,
	},
	modalButtonPrimaryText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
	modalButtonSecondary: {
		backgroundColor: "#CCCCCC",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	modalButtonSecondaryText: {
		color: "#333333",
		fontSize: 16,
		fontWeight: "bold",
	},
	// Loading Overlay
	loadingOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,0.7)",
		justifyContent: "center",
		alignItems: "center",
	},
	// Error Overlay
	errorOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,0.9)",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorContainer: {
		backgroundColor: "#F8D7DA",
		borderRadius: 10,
		padding: 20,
		alignItems: "center",
		width: "100%",
	},
	errorText: {
		color: "#721C24",
		textAlign: "center",
		marginBottom: 15,
		fontSize: 16,
	},
	retryButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	retryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
	// Additional styles for device rendering on Dashboard (if needed)
	placeholderImage: {
		backgroundColor: "#BDBDBD",
		justifyContent: "center",
		alignItems: "center",
	},
	statusContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
});
