// CustomMapView.js
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

// Helper component to recenter the map when the coordinate changes
function MapRecenter({ center }) {
	const map = useMap();
	useEffect(() => {
		if (center) {
			map.setView(center, map.getZoom());
		}
	}, [center, map]);
	return null;
}

export default function CustomMapView({
	data,
	onMarkerPress,
	coordinate,
	draggableMarker,
	onMarkerDragEnd,
}) {
	try {
		// If a coordinate prop is provided, use it to render a single draggable marker.
		if (coordinate) {
			const center = [coordinate.latitude, coordinate.longitude];
			return (
				<View style={styles.mapWrapper}>
					<MapContainer
						center={center}
						zoom={15} // Closer zoom for location selection
						scrollWheelZoom
						style={styles.mapContainer}
					>
						{/* Recenter the map when the coordinate changes */}
						<MapRecenter center={center} />
						<TileLayer
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						/>
						<Marker
							position={center}
							icon={customIcon}
							draggable={!!draggableMarker}
							eventHandlers={
								draggableMarker && onMarkerDragEnd
									? {
											dragend: (e) => {
												// Convert the Leaflet event to a format similar to React Native’s event
												const latlng = e.target.getLatLng();
												onMarkerDragEnd({
													nativeEvent: {
														coordinate: {
															latitude: latlng.lat,
															longitude: latlng.lng,
														},
													},
												});
											},
										}
									: {}
							}
						/>
					</MapContainer>
				</View>
			);
		}

		// Otherwise, use your existing logic with the data prop.
		const validData = Array.isArray(data)
			? data.filter(
					(site) => site && site.latitude != null && site.longitude != null
				)
			: [];
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
											Device{deviceCount !== 1 ? "s" : ""}
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
