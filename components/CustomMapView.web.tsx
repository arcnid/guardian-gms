import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
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
const CustomMapView = ({ data, onMarkerPress }) => {
	try {
		const defaultCenter = [
			data[0]?.latitude || 43.509,
			data[0]?.longitude || -96.9568,
		];

		return (
			<View style={styles.mapWrapper}>
				<MapContainer
					center={defaultCenter}
					zoom={7}
					scrollWheelZoom={true}
					style={styles.mapContainer}
				>
					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					/>
					{data.map((site) => (
						<Marker
							key={site.id}
							position={[site.latitude, site.longitude]}
							icon={customIcon} // Use the custom icon here
							eventHandlers={{
								click: () => onMarkerPress(site),
							}}
						>
							<Popup>
								<View style={styles.popupContainer}>
									<Text style={styles.popupTitle}>{site.name}</Text>
									<Text style={styles.popupDetails}>
										{site.bins.length} Bin
										{site.bins.length > 1 ? "s" : ""},{" "}
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
							</Popup>
						</Marker>
					))}
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
};

const styles = StyleSheet.create({
	mapWrapper: {
		flex: 1,
	},
	mapContainer: {
		height: "100%",
		width: "100%",
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
	popupContainer: {
		padding: 0, // Simplified padding
		backgroundColor: "#ffffff", // Clean white background
		borderRadius: 6, // Slightly rounded corners
		maxWidth: 300, // Reasonable width for readability
	},
	popupTitle: {
		fontWeight: "600", // Medium weight for cleaner look
		fontSize: 16, // Balanced font size
		color: "#000000",
		marginBottom: 4, // Slight spacing below the title
	},
	popupDetails: {
		fontSize: 14,
		color: "#444444", // Subtle gray for details
		lineHeight: 18, // Better readability
	},
});

export default CustomMapView;
