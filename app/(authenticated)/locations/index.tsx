import React, { useState } from "react";
import {
	SafeAreaView,
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Platform,
	UIManager,
	LayoutAnimation,
	Modal,
	ScrollView,
	TouchableWithoutFeedback,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons"; // Additional icons
import CustomMapView from "@/components/CustomMapView";

// Enable LayoutAnimation on Android
if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

// const CustomMapView = React.lazy(() => {
// 	if (Platform.OS !== "web") {
// 		// Dynamically import only for native platforms
// 		return import("@/components/CustomMapView");
// 	}

// 	// Provide a valid fallback for web platforms
// 	return Promise.resolve({
// 		default: () => (
// 			<View style={styles.mapContainer}>
// 				<Text style={styles.mapText}>Map is not supported on the web.</Text>
// 			</View>
// 		),
// 	});
// });

// Theme Variables (Original Branding)
const Colors = {
	primary: "#71A12F",
	background: "#F5F5F5",
	cardBackground: "#FFFFFF",
	textPrimary: "#333333",
	textSecondary: "#555555",
	textMuted: "#777777",
	iconActive: "#71A12F",
	iconInactive: "#888888",
	powerOn: "#4CAF50", // Green for power on
	powerOff: "#F44336", // Red for power off
	sensorTemp: "#FF5722", // Orange for temperature
	sensorHumidity: "#2196F3", // Blue for humidity
};

// Fonts (Original Branding)
const Fonts = {
	header: {
		fontSize: 24,
		fontWeight: "700",
	},
	subHeader: {
		fontSize: 20,
		fontWeight: "600",
	},
	body: {
		fontSize: 16,
		fontWeight: "500",
	},
	caption: {
		fontSize: 12,
		fontWeight: "400",
	},
};

// Helper function to calculate time difference
const timeAgo = (timestamp) => {
	const now = new Date();
	const then = new Date(timestamp);
	const secondsPast = Math.floor((now - then) / 1000);

	if (secondsPast < 60) {
		return `${secondsPast} sec${secondsPast > 1 ? "s" : ""} ago`;
	}
	if (secondsPast < 3600) {
		const minutes = Math.floor(secondsPast / 60);
		return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
	}
	if (secondsPast < 86400) {
		const hours = Math.floor(secondsPast / 3600);
		return `${hours} hour${hours > 1 ? "s" : ""} ago`;
	}
	const days = Math.floor(secondsPast / 86400);
	return `${days} day${days > 1 ? "s" : ""} ago`;
};

// Mock data with South Dakota locations
const mockData = [
	{
		id: "1",
		name: "East River Site",
		latitude: 43.509, // East River, SD
		longitude: -96.9568,
		bins: [
			{
				id: "101",
				name: "Bin ER1",
				devices: [
					{
						id: "1001",
						name: "Control Box ER1-1",
						type: "control-box",
						isOn: true,
						isOnline: true,
					},
					{
						id: "1002",
						name: "Sensor ER1-2",
						type: "sensor",
						temperature: 20,
						humidity: 50,
						lastRead: "2024-04-27T12:30:00Z",
						isOnline: true,
					},
				],
			},
			{
				id: "102",
				name: "Bin ER2",
				devices: [
					{
						id: "1003",
						name: "Sensor ER2-1",
						type: "sensor",
						temperature: 21,
						humidity: 55,
						lastRead: "2024-04-27T12:45:00Z",
						isOnline: false,
					},
				],
			},
		],
	},
	{
		id: "2",
		name: "Sioux Falls Site",
		latitude: 43.5446, // Sioux Falls, SD
		longitude: -96.7311,
		bins: [
			{
				id: "201",
				name: "Bin SF1",
				devices: [
					{
						id: "2001",
						name: "Control Box SF1-1",
						type: "control-box",
						isOn: false,
						isOnline: true,
					},
					{
						id: "2002",
						name: "Sensor SF1-2",
						type: "sensor",
						temperature: 22,
						humidity: 60,
						lastRead: "2024-04-27T13:00:00Z",
						isOnline: true,
					},
					{
						id: "2003",
						name: "Sensor SF1-3",
						type: "sensor",
						temperature: 19,
						humidity: 48,
						lastRead: "2024-04-27T13:15:00Z",
						isOnline: false,
					},
				],
			},
		],
	},
	{
		id: "3",
		name: "Lennox Site",
		latitude: 43.3435, // Lennox, SD
		longitude: -96.3072,
		bins: [
			{
				id: "301",
				name: "Bin LX1",
				devices: [
					{
						id: "3001",
						name: "Control Box LX1-1",
						type: "control-box",
						isOn: true,
						isOnline: true,
					},
					{
						id: "3002",
						name: "Sensor LX1-2",
						type: "sensor",
						temperature: 23,
						humidity: 65,
						lastRead: "2024-04-27T14:00:00Z",
						isOnline: true,
					},
				],
			},
			{
				id: "302",
				name: "Bin LX2",
				devices: [
					{
						id: "3003",
						name: "Sensor LX2-1",
						type: "sensor",
						temperature: 18,
						humidity: 52,
						lastRead: "2024-04-27T14:15:00Z",
						isOnline: false,
					},
				],
			},
		],
	},
];

/**
 * Main Screen Component for Locations
 */
const LocationsScreen = () => {
	const [activeTab, setActiveTab] = useState("List");
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedSite, setSelectedSite] = useState(null);

	/**
	 * Handles marker press to display modal with site details
	 * @param {Object} site - The site object that was selected
	 */
	const handleMarkerPress = (site) => {
		setSelectedSite(site);
		setModalVisible(true);
	};

	return (
		<SafeAreaView style={styles.container}>
			<TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
			{activeTab === "List" ? (
				<ListView />
			) : (
				<CustomMapView onMarkerPress={handleMarkerPress} mockData={mockData} />
			)}

			{/* Modal for displaying site details */}
			{selectedSite && (
				<Modal
					animationType="slide"
					transparent={true}
					visible={modalVisible}
					onRequestClose={() => {
						setModalVisible(false);
						setSelectedSite(null);
					}}
				>
					<TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
						<View style={styles.modalOverlay} />
					</TouchableWithoutFeedback>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>{selectedSite.name}</Text>
							<TouchableOpacity onPress={() => setModalVisible(false)}>
								<MaterialIcons
									name="close"
									size={24}
									color={Colors.textPrimary}
								/>
							</TouchableOpacity>
						</View>
						<ScrollView contentContainerStyle={styles.modalContent}>
							<Text style={styles.modalSubtitle}>
								{selectedSite.bins.length} Bin
								{selectedSite.bins.length > 1 ? "s" : ""},{" "}
								{selectedSite.bins.reduce(
									(acc, bin) => acc + bin.devices.length,
									0
								)}{" "}
								Device
								{selectedSite.bins.reduce(
									(acc, bin) => acc + bin.devices.length,
									0
								) > 1
									? "s"
									: ""}
							</Text>
							{selectedSite.bins.map((bin) => (
								<BinCard key={bin.id} bin={bin} />
							))}
						</ScrollView>
					</View>
				</Modal>
			)}
		</SafeAreaView>
	);
};

/**
 * TabBar Component to switch between List and Map views
 */
const TabBar = ({ activeTab, setActiveTab }) => {
	return (
		<View style={styles.tabBar}>
			{/* List Tab */}
			<TouchableOpacity
				style={[styles.tabItem, activeTab === "List" && styles.activeTabItem]}
				onPress={() => setActiveTab("List")}
				activeOpacity={0.7}
			>
				<MaterialIcons
					name="list"
					size={24}
					color={activeTab === "List" ? Colors.primary : Colors.iconInactive}
				/>
				<Text
					style={[styles.tabText, activeTab === "List" && styles.activeTabText]}
				>
					List
				</Text>
			</TouchableOpacity>

			{/* Map Tab */}
			<TouchableOpacity
				style={[styles.tabItem, activeTab === "Map" && styles.activeTabItem]}
				onPress={() => setActiveTab("Map")}
				activeOpacity={0.7}
			>
				<Ionicons
					name="map"
					size={24}
					color={activeTab === "Map" ? Colors.primary : Colors.iconInactive}
				/>
				<Text
					style={[styles.tabText, activeTab === "Map" && styles.activeTabText]}
				>
					Map
				</Text>
			</TouchableOpacity>
		</View>
	);
};

/**
 * ListView Component to display list of sites
 */
const ListView = () => {
	return (
		<FlatList
			contentContainerStyle={styles.listContainer}
			data={mockData}
			keyExtractor={(item) => item.id}
			renderItem={({ item }) => <SiteCard site={item} />}
			ItemSeparatorComponent={() => <View style={styles.separator} />}
		/>
	);
};

/**
 * SiteCard Component representing each site in the list
 */
const SiteCard = ({ site }) => {
	const [expanded, setExpanded] = useState(false);

	/**
	 * Toggles the expanded state of the card
	 */
	const toggleExpand = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setExpanded(!expanded);
	};

	return (
		<View style={styles.card}>
			<TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
				<View style={styles.cardHeader}>
					<View style={styles.cardHeaderLeft}>
						{/* Site Icon */}
						<MaterialIcons
							name="location-city"
							size={28}
							color={Colors.primary}
							style={styles.siteIcon}
						/>
						<View>
							<Text style={styles.cardTitle}>{site.name}</Text>
							<Text style={styles.cardSubtitle}>
								{site.bins.length} Bin{site.bins.length > 1 ? "s" : ""},{" "}
								{site.bins.reduce((acc, bin) => acc + bin.devices.length, 0)}{" "}
								Device
								{site.bins.reduce((acc, bin) => acc + bin.devices.length, 0) > 1
									? "s"
									: ""}
							</Text>
						</View>
					</View>
					{/* Expand/Collapse Icon */}
					<MaterialIcons
						name={expanded ? "expand-less" : "expand-more"}
						size={24}
						color={Colors.primary}
						style={[styles.expandIcon, expanded && styles.expandIconRotated]}
					/>
				</View>
			</TouchableOpacity>

			{/* Expanded Content */}
			{expanded && (
				<View style={styles.cardContent}>
					{site.bins.map((bin) => (
						<BinCard key={bin.id} bin={bin} />
					))}
				</View>
			)}
		</View>
	);
};

/**
 * BinCard Component representing each bin within a site
 */
const BinCard = ({ bin }) => {
	const [expanded, setExpanded] = useState(false);

	/**
	 * Toggles the expanded state of the bin card
	 */
	const toggleExpand = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setExpanded(!expanded);
	};

	return (
		<View style={styles.binCard}>
			<TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
				<View style={styles.binHeader}>
					<View style={styles.binHeaderLeft}>
						{/* Bin Icon */}
						<MaterialIcons
							name="storage"
							size={24}
							color={Colors.primary}
							style={styles.binIcon}
						/>
						<View>
							<Text style={styles.binTitle}>{bin.name}</Text>
							<Text style={styles.binSubtitle}>
								{bin.devices.length} Device{bin.devices.length > 1 ? "s" : ""}
							</Text>
						</View>
					</View>
					{/* Expand/Collapse Icon */}
					<MaterialIcons
						name={expanded ? "expand-less" : "expand-more"}
						size={24}
						color={Colors.primary}
						style={[styles.expandIcon, expanded && styles.expandIconRotated]}
					/>
				</View>
			</TouchableOpacity>

			{/* Expanded Device List */}
			{expanded && (
				<View style={styles.deviceList}>
					{bin.devices.map((device) => (
						<DeviceItem key={device.id} device={device} />
					))}
				</View>
			)}
		</View>
	);
};

/**
 * DeviceItem Component representing each device within a bin
 */
const DeviceItem = ({ device }) => {
	/**
	 * Handles press events on a device item
	 */
	const handlePress = () => {
		// Implement navigation logic here
		console.log(`Pressed on ${device.name}`);
	};

	/**
	 * Renders the appropriate icon based on device type and state
	 */
	const renderDeviceIcon = () => {
		if (device.type === "control-box") {
			return device.isOn ? (
				<MaterialIcons name="power" size={24} color={Colors.powerOn} />
			) : (
				<MaterialIcons name="power-off" size={24} color={Colors.powerOff} />
			);
		} else if (device.type === "sensor") {
			return (
				<View style={styles.sensorIconsContainer}>
					<MaterialIcons
						name="thermostat"
						size={20}
						color={Colors.sensorTemp}
					/>
					{/* Added humidity icon */}
					<FontAwesome5 name="water" size={20} color={Colors.sensorHumidity} />
				</View>
			);
		}
		return null;
	};

	/**
	 * Calculates the time since the last read for sensors
	 */
	const getTimeAgo = () => {
		if (device.type === "sensor" && device.lastRead) {
			return timeAgo(device.lastRead);
		}
		return null;
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.7}
			accessible={true}
			accessibilityLabel={`Device ${device.name}`}
		>
			<View
				style={[
					styles.deviceContainer,
					!device.isOnline && styles.deviceOffline,
				]}
			>
				{/* Device Icon and Status Dot */}
				<View style={styles.deviceIconContainer}>
					{renderDeviceIcon()}
					<View
						style={[
							styles.statusDot,
							device.isOnline ? styles.statusOnline : styles.statusOffline,
						]}
					/>
				</View>

				{/* Device Information */}
				<View style={styles.deviceInfo}>
					<Text style={styles.deviceName}>{device.name}</Text>
					<Text style={styles.deviceStatus}>
						{device.isOnline ? "Online" : "Offline"}
					</Text>

					{/* Control Box Specific Info */}
					{device.type === "control-box" && (
						<Text style={styles.powerState}>
							Power: {device.isOn ? "On" : "Off"}
						</Text>
					)}

					{/* Sensor Specific Info */}
					{device.type === "sensor" && device.isOnline && (
						<View style={styles.sensorData}>
							<View style={styles.sensorRow}>
								<MaterialIcons
									name="thermostat"
									size={16}
									color={Colors.sensorTemp}
								/>
								<Text style={styles.sensorValue}>{device.temperature}°C</Text>
							</View>
							<View style={styles.sensorRow}>
								<FontAwesome5
									name="water"
									size={16}
									color={Colors.sensorHumidity}
								/>
								<Text style={styles.sensorValue}>{device.humidity}%</Text>
							</View>
							<View style={styles.sensorRow}>
								<MaterialIcons
									name="access-time"
									size={16}
									color={Colors.textMuted}
								/>
								<Text style={styles.sensorValue}>{getTimeAgo()}</Text>
							</View>
						</View>
					)}
				</View>

				{/* Chevron Icon */}
				<MaterialIcons
					name="chevron-right"
					size={24}
					color={Colors.iconInactive}
				/>
			</View>
		</TouchableOpacity>
	);
};

/**
 * CustomMapView Component to display sites on a map
 * Modified to handle web platform by showing a placeholder message
 */
/**
 * CustomMapView Component to display sites on a map
 * Conditionally renders MapView for native platforms or a placeholder for web.
 */

/**
 * Stylesheet for the component
 */
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	header: {
		paddingVertical: 20,
		paddingHorizontal: 20,
		backgroundColor: Colors.primary,
		alignItems: "center",
	},
	headerTitle: {
		fontSize: Fonts.header.fontSize,
		fontWeight: Fonts.header.fontWeight,
		color: Colors.cardBackground,
	},
	tabBar: {
		flexDirection: "row",
		backgroundColor: Colors.cardBackground,
		elevation: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	tabItem: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
		justifyContent: "center",
		borderBottomWidth: 2,
		borderBottomColor: "transparent",
	},
	activeTabItem: {
		borderBottomColor: Colors.primary,
	},
	tabText: {
		fontSize: Fonts.body.fontSize,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	activeTabText: {
		color: Colors.primary,
		fontWeight: "600",
	},
	listContainer: {
		padding: 16,
	},
	separator: {
		height: 16,
	},
	card: {
		backgroundColor: Colors.cardBackground,
		borderRadius: 12,
		padding: 20,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cardHeaderLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	siteIcon: {
		marginRight: 10,
	},
	cardTitle: {
		fontSize: Fonts.subHeader.fontSize,
		fontWeight: Fonts.subHeader.fontWeight,
		color: Colors.textPrimary,
	},
	cardSubtitle: {
		fontSize: Fonts.body.fontSize - 2, // Slightly smaller than main text
		color: Colors.textMuted,
		marginTop: 4,
	},
	expandIcon: {
		transform: [{ rotate: "0deg" }],
	},
	expandIconRotated: {
		transform: [{ rotate: "180deg" }],
	},
	cardContent: {
		marginTop: 12,
	},
	binCard: {
		marginTop: 12,
		paddingLeft: 12,
		borderLeftWidth: 2,
		borderLeftColor: Colors.primary,
	},
	binHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	binHeaderLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	binIcon: {
		marginRight: 10,
	},
	binTitle: {
		fontSize: Fonts.body.fontSize,
		fontWeight: "500",
		color: Colors.textPrimary,
	},
	binSubtitle: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textMuted,
		marginTop: 2,
	},
	deviceList: {
		marginLeft: 16,
		marginTop: 6,
	},
	deviceContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
		backgroundColor: Colors.cardBackground,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: Colors.iconInactive,
	},
	deviceOffline: {
		opacity: 0.6,
	},
	deviceIconContainer: {
		position: "relative",
		marginRight: 12,
		width: 32, // Fixed width to ensure consistency
		alignItems: "center",
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		position: "absolute",
		bottom: 0,
		right: 0,
	},
	statusOnline: {
		backgroundColor: Colors.powerOn,
	},
	statusOffline: {
		backgroundColor: Colors.powerOff,
	},
	deviceInfo: {
		flex: 1,
	},
	deviceName: {
		fontSize: Fonts.body.fontSize,
		fontWeight: "500",
		color: Colors.textPrimary,
		marginBottom: 2,
	},
	deviceStatus: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textMuted,
		marginBottom: 2,
	},
	powerState: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textSecondary,
		marginBottom: 2,
	},
	sensorData: {
		marginTop: 4,
	},
	sensorRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 2, // Space between rows
	},
	sensorValue: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textMuted,
		marginLeft: 4, // Space between icon and text
	},
	sensorText: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textMuted,
	},
	sensorIconsContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	waterIcon: {
		marginLeft: 6,
	},
	mapContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	mapText: {
		fontSize: 18,
		color: "#555555",
		textAlign: "center",
		padding: 20,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	modalContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		maxHeight: "80%",
		backgroundColor: Colors.cardBackground,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 10,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	modalTitle: {
		fontSize: Fonts.subHeader.fontSize,
		fontWeight: Fonts.subHeader.fontWeight,
		color: Colors.textPrimary,
	},
	modalSubtitle: {
		fontSize: Fonts.body.fontSize - 2,
		color: Colors.textMuted,
		marginTop: 4,
		marginBottom: 10,
	},
	modalContent: {
		paddingBottom: 20,
	},
});

export default LocationsScreen;
