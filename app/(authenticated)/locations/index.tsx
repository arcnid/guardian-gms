import React, {
	useState,
	useRef,
	useEffect,
	useContext,
	useCallback,
	memo,
} from "react";
import {
	SafeAreaView,
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	LayoutAnimation,
	Animated,
	Modal,
	ScrollView,
	TouchableWithoutFeedback,
	ActivityIndicator,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Ensure you have expo-router installed
import AsyncStorage from "@react-native-async-storage/async-storage"; // Ensure AsyncStorage is installed

import CustomMapView from "@/components/CustomMapView"; // Adjust the import path as needed
import { locationService } from "@/services/locations/service"; // Adjust the import path as needed
import { AuthContext } from "@/contexts/AuthContext"; // Adjust the import path as needed

// Import your reanimated LocationsList
import { LocationsList } from "@/components/locations/Locations";

/** -----------------------------------------------------------------------
 * THEME & HELPERS
 * ----------------------------------------------------------------------- */
const Colors = {
	primary: "#71A12F",
	background: "#F5F5F5",
	cardBackground: "#FFFFFF",
	textPrimary: "#333333",
	textSecondary: "#555555",
	textMuted: "#777777",
	iconActive: "#71A12F",
	iconInactive: "#888888",
	powerOn: "#4CAF50",
	powerOff: "#F44336",
	sensorTemp: "#FF5722",
	sensorHumidity: "#2196F3",
};

const Fonts = {
	subHeader: { fontSize: 20, fontWeight: "600" },
	body: { fontSize: 16, fontWeight: "500" },
	caption: { fontSize: 12, fontWeight: "400" },
};

// timeAgo helper function
const timeAgo = (timestamp) => {
	const now = new Date();
	const then = new Date(timestamp);
	const secondsPast = Math.floor((now - then) / 1000);
	if (secondsPast < 60) return `${secondsPast}s ago`;
	if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)}m ago`;
	if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)}h ago`;
	return `${Math.floor(secondsPast / 86400)}d ago`;
};

/** -----------------------------------------------------------------------
 * LocationsScreen
 * ----------------------------------------------------------------------- */
const LocationsScreen = () => {
	const { userId } = useContext(AuthContext);
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("List");
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedSite, setSelectedSite] = useState(null);
	const [locations, setLocations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// State variables for device selection
	const [selectedLocation, setSelectedLocation] = useState(null);
	const [selectedBin, setSelectedBin] = useState(null);
	const [selectedDevice, setSelectedDevice] = useState(null);

	// Cache configuration
	const CACHE_KEY = "locationsCache";
	const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

	/**
	 * Saves locations to AsyncStorage
	 * @param {Array<any>} data - The locations data to cache
	 */
	const cacheLocations = async (data) => {
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
	useEffect(() => {
		fetchLocations();
	}, [fetchLocations]);

	/**
	 * Handles marker press to display modal with site details
	 * @param {Object} site - The site object that was selected
	 */
	const handleMarkerPress = (site) => {
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

	// Early return if loading
	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={Colors.primary} />
				<Text style={{ marginTop: 10 }}>Loading...</Text>
			</View>
		);
	}

	// Early return if error
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
				<ScrollView style={styles.locationsListContainer}>
					<LocationsList
						data={locations}
						selectable={false} // or true if you want device selection
						selectedDevice={selectedDevice}
						onDeviceSelect={(locId, binId, devId) => {
							setSelectedLocation(locId);
							setSelectedBin(binId);
							setSelectedDevice(devId);
							// Optionally navigate or do other actions
						}}
					/>
				</ScrollView>
			) : (
				<CustomMapView data={locations} onMarkerPress={handleMarkerPress} />
			)}

			{/* Floating "Add Location" Button */}
			<TouchableOpacity
				style={styles.addButton}
				onPress={() => router.push("/locations/add-location")}
				activeOpacity={0.8}
			>
				<MaterialIcons name="add" size={30} color="#fff" />
			</TouchableOpacity>

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

						{/* 
							Use LocationsList here, passing [selectedSite] as the data array.
							This replaces the ScrollView + manual bin map.
						*/}
						<View style={styles.modalContent}>
							<LocationsList
								data={[selectedSite]}
								selectable={false} // or true, if you want to allow selection
								selectedDevice={null}
							/>
						</View>
					</View>
				</Modal>
			)}
		</SafeAreaView>
	);
};

/** -----------------------------------------------------------------------
 * TabBar Component to switch between List and Map views
 * ----------------------------------------------------------------------- */
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

/** -----------------------------------------------------------------------
 * Styles
 * ----------------------------------------------------------------------- */
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	locationsListContainer: {
		flex: 1,
		padding: 10,
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

	/** Modal **/
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
	modalContent: {
		flex: 1,
		// You can add padding or other styles if desired
	},

	/** Floating "Add Location" Button **/
	addButton: {
		position: "absolute",
		bottom: 20,
		right: 20,
		backgroundColor: Colors.primary,
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		elevation: 5,
	},
});

export default LocationsScreen;
