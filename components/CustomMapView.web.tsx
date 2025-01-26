import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Marker Icon
const customIcon = new L.Icon({
	iconUrl:
		"https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png", // Default Leaflet marker icon
	iconSize: [30, 45], // Slightly larger icon size
	iconAnchor: [15, 45], // Adjust anchor point to the bottom of the icon
	popupAnchor: [0, -40], // Adjust popup anchor to align with the icon
});

/**
 * CustomMapView Component to display sites on a map
 * @param {Array} data - Array of location objects fetched from the service
 * @param {Function} onMarkerPress - Function to handle marker press events
 */
export default function CustomMapView({ data, onMarkerPress }) {
	try {
		// Ensure data is an array and filter out invalid sites
		const validData = Array.isArray(data)
			? data.filter(
					(site) => site && site.latitude != null && site.longitude != null
				)
			: [];

		// Use the first site as the default center, or fallback
		const defaultCenter =
			validData.length > 0
				? [validData[0].latitude || 43.509, validData[0].longitude || -96.9568]
				: [43.509, -96.9568];

		return (
			<View style={styles.mapWrapper}>
				<MapContainer
					center={defaultCenter}
					zoom={7}
					scrollWheelZoom
					style={styles.mapContainer}
				>
					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					/>
					{validData.map((site) => {
						// Count bins/devices safely
						const binCount = Array.isArray(site.bins) ? site.bins.length : 0;
						const deviceCount = Array.isArray(site.bins)
							? site.bins.reduce((acc, bin) => {
									if (bin && Array.isArray(bin.devices)) {
										return acc + bin.devices.filter(Boolean).length;
									}
									return acc;
								}, 0)
							: 0;

						return (
							<Marker
								key={site.id}
								position={[site.latitude, site.longitude]}
								icon={customIcon}
								eventHandlers={{
									click: () => onMarkerPress(site),
								}}
							>
								<Popup>
									<View style={styles.popupContainer}>
										<Text style={styles.popupTitle}>
											{site.name || "Unnamed Site"}
										</Text>
										<Text style={styles.popupDetails}>
											{binCount} Bin{binCount !== 1 ? "s" : ""}, {deviceCount}{" "}
											Device
											{deviceCount !== 1 ? "s" : ""}
										</Text>
									</View>
								</Popup>
							</Marker>
						);
					})}
				</MapContainer>
			</View>
		);
	} catch (error) {
		console.error("Error rendering Leaflet map:", error);
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>
					Error loading map. Please try again.
				</Text>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	mapWrapper: {
		flex: 1,
	},
	mapContainer: {
		width: "100%",
		height: "100%",
	},
	popupContainer: {
		padding: 0,
		backgroundColor: "#ffffff",
		borderRadius: 6,
		maxWidth: 300,
	},
	popupTitle: {
		fontWeight: "600",
		fontSize: 16,
		marginBottom: 4,
	},
	popupDetails: {
		fontSize: 14,
		color: "#444",
		lineHeight: 18,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f8d7da",
	},
	errorText: {
		color: "#721c24",
		fontSize: 16,
	},
});
