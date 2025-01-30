import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Switch,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "@/components/BackButton";

const Privacy = () => {
	const [dataCollectionEnabled, setDataCollectionEnabled] = useState(false);
	const [locationAccessEnabled, setLocationAccessEnabled] = useState(false);

	// Handle toggles
	const handleDataCollectionToggle = () => {
		setDataCollectionEnabled((prev) => !prev);
		Alert.alert(
			"Data Collection",
			`Data collection has been ${!dataCollectionEnabled ? "enabled" : "disabled"}.`
		);
	};

	const handleLocationAccessToggle = () => {
		setLocationAccessEnabled((prev) => !prev);
		Alert.alert(
			"Location Access",
			`Location access has been ${!locationAccessEnabled ? "enabled" : "disabled"}.`
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			{/* Back Button outside ScrollView */}
			<View style={styles.header}>
				<BackButton label="Settings" />
			</View>

			{/* Scrollable Content */}
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.heading}>Privacy Settings</Text>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Data Collection</Text>
					<Text style={styles.cardContent}>
						Allow the app to collect usage data to improve performance and
						experience. This data will never be shared with third parties.
					</Text>
					<Switch
						value={dataCollectionEnabled}
						onValueChange={handleDataCollectionToggle}
					/>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Location Access</Text>
					<Text style={styles.cardContent}>
						Allow the app to access your location to provide accurate
						temperature and humidity alerts based on your environment.
					</Text>
					<Switch
						value={locationAccessEnabled}
						onValueChange={handleLocationAccessToggle}
					/>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Privacy Policy</Text>
					<Text style={styles.cardContent}>
						Read our privacy policy to understand how your data is handled.
					</Text>
					<Text
						style={styles.cardContentAccent}
						onPress={() =>
							Alert.alert("Privacy Policy", "Opening privacy policy...")
						}
					>
						View Privacy Policy
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default Privacy;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F5F5F5", // Matches container background
	},
	header: {
		paddingHorizontal: 16,
		paddingTop: 8,
		backgroundColor: "#F5F5F5",
	},
	container: {
		padding: 16,
		paddingBottom: 32, // Ensures bottom spacing for scroll
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
		marginBottom: 12,
	},
	cardContentAccent: {
		fontSize: 16,
		color: "#71A12F", // Green for highlights
		fontWeight: "bold",
		textDecorationLine: "underline",
	},
});
