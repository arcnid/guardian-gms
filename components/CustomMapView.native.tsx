import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

const CustomMapView = ({ onMarkerPress, mockData }) => {
	const initialRegion = {
		latitude: mockData[0]?.latitude || 43.509,
		longitude: mockData[0]?.longitude || -96.9568,
		latitudeDelta: 5,
		longitudeDelta: 5,
	};

	return (
		<MapView style={styles.mapContainer} initialRegion={initialRegion}>
			{mockData.map((site) => (
				<Marker
					key={site.id}
					coordinate={{
						latitude: site.latitude,
						longitude: site.longitude,
					}}
					title={site.name}
					description={`${site.bins.length} Bins, ${site.bins.reduce(
						(acc, bin) => acc + bin.devices.length,
						0
					)} Devices`}
					onPress={() => onMarkerPress(site)}
				/>
			))}
		</MapView>
	);
};

const styles = StyleSheet.create({
	mapContainer: {
		flex: 1,
	},
});

export default CustomMapView;
