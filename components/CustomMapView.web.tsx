import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CustomMapView = () => {
	return (
		<View style={styles.mapContainer}>
			<Text style={styles.mapText}>Map is not supported on the web.</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	mapContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f0f0f0",
	},
	mapText: {
		fontSize: 16,
		color: "#333",
	},
});

export default CustomMapView;
