import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../../../../components/BackButton"; // Import BackButton

const About = () => {
	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView style={styles.container}>
				{/* Reusable Back Button */}
				<BackButton />

				<Text style={styles.heading}>About This Application</Text>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Application Information</Text>
					<Text style={styles.cardContent}>Version: 1.0.0</Text>
					<Text style={styles.cardContent}>Last Updated: November 2024</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Device Firmware</Text>
					<Text style={styles.cardContent}>Connected Device: Smart Sensor</Text>
					<Text style={styles.cardContent}>Firmware Version: 3.4.7</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Support</Text>
					<Text style={styles.cardContent}>
						If you encounter any issues, please contact our support team at:
					</Text>
					<Text style={styles.cardContentAccent}>support@example.com</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F5F5F5", // Matches container background
	},
	container: {
		flex: 1,
		padding: 16,
	},
	heading: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333", // Black heading text
		marginBottom: 16,
		textAlign: "center",
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333", // Black title text
		marginBottom: 8,
	},
	cardContent: {
		fontSize: 16,
		color: "#333", // Black card content
		marginBottom: 4,
	},
	cardContentAccent: {
		fontSize: 16,
		color: "#71A12F", // Green for email and highlights
		fontWeight: "bold",
	},
});

export default About;
