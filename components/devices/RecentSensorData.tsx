import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	Image,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	ScrollView,
} from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

export const RecentSensorData = ({
	temp,
	humid,
}: {
	temp: number;
	humid: number;
}) => {
	return (
		<View style={styles.sensorData}>
			<Text style={styles.sectionHeader}>Recent Sensor Data</Text>
			<View style={styles.sensorRow}>
				<MaterialIcons name="thermostat" size={30} color="#FF5722" />
				<Text style={styles.sensorValue}>Temperature: {temp || "N/A"}°C</Text>
			</View>
			<View style={styles.sensorRow}>
				<FontAwesome5 name="water" size={30} color="#2196F3" />
				<Text style={styles.sensorValue}>Humidity: {humid || "N/A"}%</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	sensorData: {
		backgroundColor: "#FFF",
		padding: 15,
		borderRadius: 10,
		elevation: 3,
	},
	sensorRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
	},
	sensorValue: {
		fontSize: 16,
		color: "#333",
		marginLeft: 10,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
	},
});
