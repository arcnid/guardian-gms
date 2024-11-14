// app/(authenticated)/devices.js
import React from "react";
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	FlatList,
	SafeAreaView,
	Image,
	RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";

// Mock data for registered devices
const initialDevices = [
	{
		id: "1",
		name: "Thermostat",
		status: "Online",
		image: "https://via.placeholder.com/60",
	},
	{
		id: "2",
		name: "Smart Light",
		status: "Offline",
		image: "https://via.placeholder.com/60",
	},
	{
		id: "3",
		name: "Security Camera",
		status: "Online",
		image: "https://via.placeholder.com/60",
	},
	{
		id: "4",
		name: "Smart Lock",
		status: "Offline",
		image: "https://via.placeholder.com/60",
	},
];

const DevicesScreen = () => {
	const router = useRouter();
	const [devices, setDevices] = useState(initialDevices);
	const [refreshing, setRefreshing] = useState(false);

	const handleManageDevice = (deviceId) => {
		console.log("Managing device with ID:", deviceId);
		// Navigate to a device management screen or show a modal
		router.push(`/devices/manage/${deviceId}`);
	};

	const onRefresh = () => {
		setRefreshing(true);
		// Simulate fetching data from an API
		setTimeout(() => {
			// Here you can fetch new data and update the state
			setRefreshing(false);
		}, 2000);
	};

	const renderDevice = ({ item }) => (
		<TouchableOpacity
			style={styles.deviceCard}
			onPress={() => handleManageDevice(item.id)}
			activeOpacity={0.8}
		>
			<View style={styles.deviceInfo}>
				<Image source={{ uri: item.image }} style={styles.deviceImage} />
				<View style={styles.deviceTextContainer}>
					<Text style={styles.deviceName}>{item.name}</Text>
					<View style={styles.statusContainer}>
						<MaterialIcons
							name={item.status === "Online" ? "check-circle" : "highlight-off"}
							size={16}
							color={item.status === "Online" ? "#4CAF50" : "#F44336"}
						/>
						<Text
							style={[
								styles.deviceStatus,
								{ color: item.status === "Online" ? "#4CAF50" : "#F44336" },
							]}
						>
							{item.status}
						</Text>
					</View>
				</View>
			</View>
			<MaterialIcons name="more-horiz" color="#71A12F" size={24} />
		</TouchableOpacity>
	);

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

			{/* Device List */}
			<FlatList
				data={devices}
				keyExtractor={(item) => item.id}
				renderItem={renderDevice}
				contentContainerStyle={styles.listContent}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer}>
						<MaterialIcons name="device-hub" size={60} color="#ccc" />
						<Text style={styles.emptyText}>
							No devices found. Add a new device to get started.
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
	manageButton: {
		padding: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	separator: {
		height: 16,
	},
	emptyContainer: {
		alignItems: "center",
		marginTop: 50,
	},
	emptyText: {
		marginTop: 20,
		fontSize: 16,
		color: "#888",
		textAlign: "center",
		paddingHorizontal: 20,
	},
});
