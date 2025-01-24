import React, {
	useState,
	useRef,
	useCallback,
	useContext,
	useEffect,
} from "react";
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
	Animated,
	ActivityIndicator,
	Alert,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons"; // Additional icons
import CustomMapView from "@/components/CustomMapView";
import { locationService } from "@/services/locations/service";
import { AuthContext } from "@/contexts/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

// Enable LayoutAnimation on Android
if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

// Cache configuration
const CACHE_KEY = "locationsCache";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper function to calculate time difference
const timeAgo = (timestamp: string) => {
	const now = new Date();
	const then = new Date(timestamp);
	const secondsPast = Math.floor((now.getTime() - then.getTime()) / 1000);

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

/**
 * Main Screen Component for Locations
 */
const LocationsScreen = () => {
	const { userId } = useContext(AuthContext);
	const [activeTab, setActiveTab] = useState("List");
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedSite, setSelectedSite] = useState(null);
	const [locations, setLocations] = useState<Array<any>>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Loads cached locations from AsyncStorage
	 */
	const loadCachedLocations = async () => {
		try {
			const cachedData = await AsyncStorage.getItem(CACHE_KEY);
			if (cachedData !== null) {
				const parsedData = JSON.parse(cachedData);
				const { timestamp, data } = parsedData;
				const now = new Date().getTime();

				if (now - timestamp < CACHE_DURATION) {
					setLocations(data);
					setLoading(false);
					console.log("Loaded locations from cache.");
				} else {
					console.log("Cache expired. Fetching new data.");
				}
			}
		} catch (err) {
			console.error("Error loading cached locations:", err);
		}
	};

	/**
	 * Saves locations to AsyncStorage
	 * @param {Array<any>} data - The locations data to cache
	 */
	const cacheLocations = async (data: Array<any>) => {
		try {
			const cacheEntry = {
				timestamp: new Date().getTime(),
				data,
			};
			await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
			console.log("Locations cached successfully.");
		} catch (err) {
			console.error("Error caching locations:", err);
		}
	};

	const fetchLocations = useCallback(async () => {
		try {
			// Attempt to load cached data first
			const cachedData = await AsyncStorage.getItem(CACHE_KEY);
			if (cachedData) {
				const { timestamp, data } = JSON.parse(cachedData);
				const now = Date.now();

				// If cache is valid, display cached data immediately
				if (now - timestamp < CACHE_DURATION) {
					setLocations(data);
					console.log("Using cached data.");
				}
			}

			// Fetch fresh data in the background
			const res = await locationService.getLocationsForUser(userId);

			// Compare the fetched data with cached data
			if (
				!cachedData ||
				JSON.stringify(res) !== JSON.stringify(JSON.parse(cachedData)?.data)
			) {
				console.log("New data fetched. Updating UI and cache.");
				setLocations(res);
				await cacheLocations(res); // Cache the fresh data
			} else {
				console.log("Fetched data matches cached data. No update required.");
			}
		} catch (err) {
			console.error("Error fetching locations:", err);
			setError("Failed to load locations. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [userId]);

	// Fetch locations on component mount and when userId changes
	useFocusEffect(
		useCallback(() => {
			fetchLocations();
		}, [fetchLocations])
	);

	/**
	 * Handles marker press to display modal with site details
	 * @param {Object} site - The site object that was selected
	 */
	const handleMarkerPress = (site: any) => {
		setSelectedSite(site);
		setModalVisible(true);
	};

	/**
	 * Closes the modal and clears the selected site
	 */
	const closeModal = () => {
		setModalVisible(false);
		setSelectedSite(null);
	};

	/**
	 * Retry fetching locations in case of an error
	 */
	const retryFetch = () => {
		setError(null);
		setLoading(true);
		fetchLocations();
	};

	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={Colors.primary} />
				<Text style={{ marginTop: 10 }}>Loading...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centered}>
				<Text style={{ color: Colors.powerOff, marginBottom: 10 }}>
					{error}
				</Text>
				<TouchableOpacity
					onPress={retryFetch}
					style={styles.retryButton}
					activeOpacity={0.7}
				>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
			{activeTab === "List" ? (
				<ListView locations={locations} />
			) : (
				<CustomMapView data={locations} onMarkerPress={handleMarkerPress} />
			)}

			{/* Modal for displaying site details */}
			{selectedSite && (
				<Modal
					animationType="slide"
					transparent={true}
					visible={modalVisible}
					onRequestClose={closeModal}
				>
					<TouchableWithoutFeedback onPress={closeModal}>
						<View style={styles.modalOverlay} />
					</TouchableWithoutFeedback>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>{selectedSite.name}</Text>
							<TouchableOpacity onPress={closeModal}>
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
									(acc: number, bin: any) => acc + bin.devices.length,
									0
								)}{" "}
								Device
								{selectedSite.bins.reduce(
									(acc: number, bin: any) => acc + bin.devices.length,
									0
								) > 1
									? "s"
									: ""}
							</Text>
							{selectedSite.bins.map((bin: any) => (
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
const ListView = ({ locations }) => {
	return (
		<FlatList
			contentContainerStyle={styles.listContainer}
			data={locations}
			keyExtractor={(item) => item.id}
			renderItem={({ item }) => <SiteCard site={item} />}
			ItemSeparatorComponent={() => <View style={styles.separator} />}
			// Improve performance by providing estimated item size
			initialNumToRender={10}
			maxToRenderPerBatch={10}
			windowSize={21}
			removeClippedSubviews={true}
		/>
	);
};

/**
 * SiteCard Component representing each site in the list
 */
const SiteCard = ({ site }) => {
	const [expanded, setExpanded] = useState(false);
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;

	/**
	 * Toggles the expanded state of the card
	 */
	const toggleExpand = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setExpanded(!expanded);
	};

	/**
	 * Handles press in animation
	 */
	const onPressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.97,
			friction: 3,
			tension: 40,
			useNativeDriver: true,
		}).start();
	};

	/**
	 * Handles press out animation
	 */
	const onPressOut = () => {
		Animated.spring(scaleAnim, {
			toValue: 1,
			friction: 3,
			tension: 40,
			useNativeDriver: true,
		}).start();
	};

	/**
	 * Handles rotation animation for the expand icon
	 */
	useEffect(() => {
		Animated.timing(rotateAnim, {
			toValue: expanded ? 1 : 0,
			duration: 200,
			useNativeDriver: true,
		}).start();
	}, [expanded, rotateAnim]);

	const rotateInterpolate = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "180deg"],
	});

	return (
		<Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
			<TouchableOpacity
				onPress={toggleExpand}
				activeOpacity={0.7}
				onPressIn={onPressIn}
				onPressOut={onPressOut}
			>
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
								{site.bins.reduce(
									(acc: number, bin: any) => acc + bin.devices.length,
									0
								)}{" "}
								Device
								{site.bins.reduce(
									(acc: number, bin: any) => acc + bin.devices.length,
									0
								) > 1
									? "s"
									: ""}
							</Text>
						</View>
					</View>
					{/* Expand/Collapse Icon with Rotation Animation */}
					<Animated.View
						style={{
							transform: [{ rotate: rotateInterpolate }],
						}}
					>
						<MaterialIcons
							name="expand-more"
							size={24}
							color={Colors.primary}
							style={styles.expandIcon}
						/>
					</Animated.View>
				</View>
			</TouchableOpacity>

			{/* Expanded Content */}
			{expanded && (
				<View style={styles.cardContent}>
					{site.bins.map((bin: any) => (
						<BinCard key={bin.id} bin={bin} />
					))}
				</View>
			)}
		</Animated.View>
	);
};

/**
 * BinCard Component representing each bin within a site
 */
const BinCard = ({ bin }) => {
	const [expanded, setExpanded] = useState(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;

	/**
	 * Toggles the expanded state of the bin card
	 */
	const toggleExpand = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setExpanded(!expanded);

		if (!expanded) {
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();
		} else {
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start();
		}
	};

	/**
	 * Handles press in animation
	 */
	const onPressIn = () => {
		Animated.spring(scaleAnim, {
			toValue: 0.97,
			friction: 3,
			tension: 40,
			useNativeDriver: true,
		}).start();
	};

	/**
	 * Handles press out animation
	 */
	const onPressOut = () => {
		Animated.spring(scaleAnim, {
			toValue: 1,
			friction: 3,
			tension: 40,
			useNativeDriver: true,
		}).start();
	};

	/**
	 * Handles rotation animation for the expand icon
	 */
	useEffect(() => {
		Animated.timing(rotateAnim, {
			toValue: expanded ? 1 : 0,
			duration: 200,
			useNativeDriver: true,
		}).start();
	}, [expanded, rotateAnim]);

	const rotateInterpolate = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "180deg"],
	});

	return (
		<Animated.View
			style={[styles.binCard, { transform: [{ scale: scaleAnim }] }]}
		>
			<TouchableOpacity
				onPress={toggleExpand}
				activeOpacity={0.7}
				onPressIn={onPressIn}
				onPressOut={onPressOut}
			>
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
					{/* Expand/Collapse Icon with Rotation Animation */}
					<Animated.View
						style={{
							transform: [{ rotate: rotateInterpolate }],
						}}
					>
						<MaterialIcons
							name="expand-more"
							size={24}
							color={Colors.primary}
							style={styles.expandIcon}
						/>
					</Animated.View>
				</View>
			</TouchableOpacity>

			{/* Expanded Device List with Fade-in Animation */}
			{expanded && (
				<Animated.View style={[styles.deviceList, { opacity: fadeAnim }]}>
					{bin.devices.map((device: any) => (
						<DeviceItem key={device.id} device={device} />
					))}
				</Animated.View>
			)}
		</Animated.View>
	);
};

/**
 * DeviceItem Component representing each device within a bin
 */
const DeviceItem = ({ device }) => {
	const router = useRouter();
	/**
	 * Handles press events on a device item
	 */
	const handlePress = () => {
		// Implement navigation logic here
		router.push(`/devices/${device.id}`); // Example route
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
					<FontAwesome5
						name="water"
						size={20}
						color={Colors.sensorHumidity}
						style={styles.waterIcon}
					/>
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
 * Stylesheet for the component
 */
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	retryButton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		backgroundColor: Colors.primary,
		borderRadius: 8,
	},
	retryButtonText: {
		color: "#FFFFFF",
		fontSize: Fonts.body.fontSize,
		fontWeight: "500",
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
		// Removed static rotation
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
