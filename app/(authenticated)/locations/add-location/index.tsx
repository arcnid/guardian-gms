// add-location.js
import React, { useState, useEffect, useRef, useContext } from "react";
import {
	SafeAreaView,
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
	FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "@/contexts/AuthContext"; // Import your AuthContext
import { locationService } from "@/services/locations/service"; // Import your locations service

// Import your custom map view and back button component
import CustomMapView from "@/components/CustomMapView";
import BackButton from "@/components/BackButton";

const AddLocation = () => {
	const router = useRouter();
	const [locationName, setLocationName] = useState("");
	const [address, setAddress] = useState("");
	const [coordinate, setCoordinate] = useState({
		latitude: 43.509,
		longitude: -96.9568,
	});
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState([]);
	const debounceRef = useRef(null);
	const { userId } = useContext(AuthContext); // Get user ID from AuthContext

	// Request device location permission and set the initial coordinate
	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission denied",
					"Permission to access location was denied."
				);
				return;
			}
			try {
				const loc = await Location.getCurrentPositionAsync({});
				setCoordinate({
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
				});
			} catch (error) {
				console.error("Error fetching device location:", error);
			}
		})();
	}, []);

	// Called when the marker is dragged on the map
	const onMarkerDragEnd = (e) => {
		const { latitude, longitude } = e.nativeEvent.coordinate;
		setCoordinate({ latitude, longitude });
	};

	// Fetch address suggestions from Nominatim
	const fetchAddressSuggestions = async (query) => {
		try {
			const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
				query
			)}&format=json&addressdetails=1&limit=5`;
			const response = await fetch(url);
			const results = await response.json();
			setSuggestions(results);
		} catch (error) {
			console.error("Error fetching suggestions:", error);
		}
	};

	// Handle changes in the address input with a debounce
	const onAddressChange = (text) => {
		setAddress(text);
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		if (text.length > 2) {
			debounceRef.current = setTimeout(() => {
				fetchAddressSuggestions(text);
			}, 500);
		} else {
			setSuggestions([]);
		}
	};

	// When a suggestion is selected, update the address and marker location
	const onSuggestionSelect = (item) => {
		setAddress(item.display_name);
		setCoordinate({
			latitude: parseFloat(item.lat),
			longitude: parseFloat(item.lon),
		});
		setSuggestions([]);
	};

	// Simulate saving the location (replace with your actual API call)
	const saveLocation = async () => {
		if (!locationName) {
			Alert.alert("Please enter a location name.");
			return;
		}

		const location = {
			name: locationName,
			user_id: userId,
			latitude: coordinate.latitude,
			longitude: coordinate.longitude,
		};
		setLoading(true);
		try {
			// Simulate an API call delay
			const res = await locationService.createLocation({
				latitude: location.latitude,
				longitude: location.longitude,
				locationName: location.name,
				userId: location.user_id,
			});

			if (!res) {
				throw new Error("Failed to save the location.");
			}

			Alert.alert("Success", "Location has been saved.", [
				{ text: "OK", onPress: () => router.push("/locations") },
			]);
		} catch (error) {
			Alert.alert("Error", "Failed to save the location. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* Header with Back Button and Title */}
			<View style={styles.header}>
				<BackButton onPress={() => router.back()} />
				<Text style={styles.headerTitle}>Add New Location</Text>
			</View>

			{/* Wrap the form in a relative container */}
			<View style={styles.formWrapper}>
				<ScrollView contentContainerStyle={styles.formContainer}>
					<Text style={styles.label}>Location Name</Text>
					<TextInput
						style={styles.input}
						placeholder="Enter location name"
						value={locationName}
						onChangeText={setLocationName}
					/>

					<Text style={styles.label}>Address (Optional)</Text>
					<View style={styles.addressContainer}>
						<View style={styles.addressRow}>
							<TextInput
								style={[styles.input, { flex: 1 }]}
								placeholder="Enter address"
								value={address}
								onChangeText={onAddressChange}
							/>
							<TouchableOpacity
								style={styles.searchButton}
								onPress={() => fetchAddressSuggestions(address)}
								disabled={loading}
							>
								{loading ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text style={styles.searchButtonText}>Search</Text>
								)}
							</TouchableOpacity>
						</View>
						{/* Render suggestions inline */}
						{suggestions.length > 0 && (
							<View style={styles.suggestionsContainer}>
								<FlatList
									data={suggestions}
									keyExtractor={(item) => item.place_id.toString()}
									renderItem={({ item }) => (
										<TouchableOpacity
											style={styles.suggestionItem}
											onPress={() => onSuggestionSelect(item)}
										>
											<Text style={styles.suggestionText}>
												{item.display_name}
											</Text>
										</TouchableOpacity>
									)}
									scrollEnabled={false}
								/>
							</View>
						)}
					</View>

					<Text style={styles.label}>Select Location on Map</Text>
					<View style={styles.mapContainer}>
						<CustomMapView
							coordinate={coordinate}
							draggableMarker={true}
							onMarkerDragEnd={onMarkerDragEnd}
						/>
					</View>

					<TouchableOpacity
						style={styles.saveButton}
						onPress={saveLocation}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.saveButtonText}>Save Location</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		backgroundColor: "#F5F5F5",
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
	},
	headerTitle: {
		flex: 1,
		textAlign: "center",
		fontSize: 20,
		fontWeight: "600",
		color: "#333",
	},
	formWrapper: {
		flex: 1,
		position: "relative",
	},
	formContainer: {
		padding: 16,
		paddingBottom: 100,
	},
	label: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "#fff",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#ccc",
	},
	addressContainer: {
		flex: 1,
		// No absolute positioning here—render inline
	},
	addressRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	searchButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginLeft: 8,
		marginBottom: 15,
	},
	searchButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "500",
	},
	suggestionsContainer: {
		backgroundColor: "#fff",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		maxHeight: 150,
		marginBottom: 16,
	},
	suggestionItem: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	suggestionText: {
		fontSize: 14,
		color: "#333",
	},
	mapContainer: {
		height: 300,
		borderRadius: 8,
		overflow: "hidden",
		marginBottom: 16,
	},
	saveButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 16,
		borderRadius: 8,
		alignItems: "center",
		marginBottom: 32,
	},
	saveButtonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
	},
});

export default AddLocation;
