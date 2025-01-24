// CustomMapView.native.js
import React from "react";
import { StyleSheet, Platform, Dimensions } from "react-native";
import MapView, { Marker, UrlTile, PROVIDER_GOOGLE } from "react-native-maps";

// Define the prop types for better type checking (optional but recommended)
import PropTypes from "prop-types";

const CustomMapView = ({ onMarkerPress, data }) => {
	// Ensure that data is an array and has at least one location
	const initialRegion = {
		latitude: data[0]?.latitude || 43.509,
		longitude: data[0]?.longitude || -96.9568,
		latitudeDelta: 0.5, // Adjusted for a closer zoom
		longitudeDelta: 0.5,
	};

	return (
		<MapView
			style={styles.mapContainer}
			initialRegion={initialRegion}
			provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
		>
			{/* Conditionally render OSM tiles only on Android */}
			{Platform.OS === "android" && (
				<UrlTile
					// OSM tile server URL
					urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
					// Optionally, set maximum and minimum zoom levels
					maximumZ={19}
					minimumZ={0}
					// Make the tiles transparent if needed
					// tileSize={256}
				/>
			)}

			{/* Render markers for each site */}
			{data.map((site) => (
				<Marker
					key={site.id}
					coordinate={{
						latitude: site.latitude,
						longitude: site.longitude,
					}}
					title={site.name}
					description={`${site.bins.length} Bin${site.bins.length > 1 ? "s" : ""}, ${site.bins.reduce(
						(acc, bin) => acc + bin.devices.length,
						0
					)} Device${site.bins.reduce((acc, bin) => acc + bin.devices.length, 0) > 1 ? "s" : ""}`}
					onPress={() => onMarkerPress(site)}
				/>
			))}
		</MapView>
	);
};

// Define prop types for better validation
CustomMapView.propTypes = {
	onMarkerPress: PropTypes.func.isRequired,
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			user_id: PropTypes.string,
			created_at: PropTypes.string,
			name: PropTypes.string.isRequired,
			latitude: PropTypes.number.isRequired,
			longitude: PropTypes.number.isRequired,
			bins: PropTypes.arrayOf(
				PropTypes.shape({
					id: PropTypes.string.isRequired,
					created_at: PropTypes.string,
					name: PropTypes.string,
					location_id: PropTypes.string,
					devices: PropTypes.arrayOf(
						PropTypes.shape({
							id: PropTypes.string.isRequired,
							name: PropTypes.string,
							type: PropTypes.string,
							humidity: PropTypes.number,
							temperature: PropTypes.number,
							lastRead: PropTypes.string,
							isOnline: PropTypes.bool,
						})
					),
				})
			),
		})
	).isRequired,
};

const styles = StyleSheet.create({
	mapContainer: {
		flex: 1,
		width: Dimensions.get("window").width, // Ensure the map takes full width
		height: Dimensions.get("window").height, // Ensure the map takes full height
	},
});

export default CustomMapView;
