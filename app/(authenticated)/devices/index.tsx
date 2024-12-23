// app/(authenticated)/devices.js
import React, {
	useState,
	useContext,
	useEffect,
	useCallback,
	useLayoutEffect,
} from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	FlatList,
	SafeAreaView,
	Image,
	RefreshControl,
	ActivityIndicator, // For loading indicator
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
	const [devices, setDevices] = useState<Device[]>([]); // Initialize as empty
	const [refreshing, setRefreshing] = useState(false);
	const [loading, setLoading] = useState(true); // Loading state
	const [error, setError] = useState<string | null>(null); // Error state

	const { userId } = useContext(AuthContext);

	// Function to fetch device list
	const getDeviceList = useCallback(async () => {
		try {
			setError(null); // Reset any previous errors
			const data = await UserDeviceService.getDevicesByUser(userId);
			console.log("Fetched Devices:", data);

			if (!Array.isArray(data)) {
				console.error("Expected data to be an array but got:", typeof data);
				setError("Invalid data format received.");
				setDevices([]);
				return;
			}

			setDevices(data);
		} catch (err) {
			console.error("Error fetching devices:", err);
			setError("Failed to fetch devices. Please try again.");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [userId]);

	// Fetch data on component mount and when userId changes
	useFocusEffect(
		useCallback(() => {
			getDeviceList();
		}, [])
	);

	// Handle device management navigation
	const handleManageDevice = (deviceId: string) => {
		console.log("Managing device with ID:", deviceId);
		// Navigate to a device management screen
		router.push(`/devices/${deviceId}`);
	};

	// Handle pull-to-refresh
	const onRefresh = () => {
		setRefreshing(true);
		getDeviceList();
	};

	// Render each device item
	const renderDevice = ({ item }: { item: Device }) => {
		// Determine the display name
		console.log(item);
		const displayName = item.device_name ? item.device_name : item.device_id;

		return (
			<TouchableOpacity
				style={styles.deviceCard}
				onPress={() => handleManageDevice(item.device_id)}
				activeOpacity={0.8}
			>
				<View style={styles.deviceInfo}>
					<Image source={{ uri: item.image }} style={styles.deviceImage} />
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
				keyExtractor={(item) => {
					if (item.device_id) {
						return item.device_id.toString();
					} else if (item.device_id) {
						// Corrected from item.id to item.device_id
						// Assuming Supabase provides a unique 'id' field
						return item.device_id.toString();
					} else {
						// Fallback to index if no unique identifier is available
						// Note: Using index as a key is not recommended for dynamic lists
						return Math.random().toString();
					}
				}}
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
	addButton: {
		backgroundColor: "#71A12F",
		borderRadius: 20,
		padding: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	listContent: {
		padding: 16,
		paddingBottom: 30, // Extra padding to ensure content is above the tab bar
	},
	deviceCard: {
		backgroundColor: "#FFFFFF", // White card background
		borderRadius: 10, // Consistent border radius
		padding: 15,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		// Shadow for iOS
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		// Elevation for Android
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
	deviceTextContainer: {
		flex: 1,
	},
	deviceName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333", // Darker text color for better readability
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
		paddingHorizontal: 20, // Ensure text doesn't touch the edges
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
