// app/dashboard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const DashboardScreen = () => {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Dashboard Screen</Text>
			<Text>Welcome to the dashboard!</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
	},
});

export default DashboardScreen;
