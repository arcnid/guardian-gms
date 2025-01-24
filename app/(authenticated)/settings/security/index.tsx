// app/(authenticated)/security.js
import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Switch,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import BackButton from "../../../../components/BackButton"; // Import BackButton

const Security = () => {
	const [is2FAEnabled, setIs2FAEnabled] = useState(false);

	// Handle 2FA toggle
	const handleToggle2FA = () => {
		setIs2FAEnabled((prev) => !prev);
		Alert.alert(
			"Two-Factor Authentication",
			`Two-Factor Authentication has been ${!is2FAEnabled ? "enabled" : "disabled"}.`
		);
	};

	// Handle Change Password
	const handleChangePassword = () => {
		// Replace this with navigation to your Change Password screen
		Alert.alert(
			"Change Password",
			"This will navigate to the Change Password screen."
		);
	};

	// Handle Logout from All Devices
	const handleLogoutAll = () => {
		Alert.alert(
			"Logout from All Devices",
			"Are you sure you want to log out from all devices?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Logout",
					onPress: () => {
						// Implement your logout logic here
						Alert.alert(
							"Logged Out",
							"You have been logged out from all devices."
						);
					},
				},
			]
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container}>
				{/* Reusable Back Button */}
				<BackButton label="Settings" />

				<Text style={styles.heading}>Security Settings</Text>

				{/* Change Password */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Change Password</Text>
					<Text style={styles.cardContent}>
						Update your account password to keep your account secure.
					</Text>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleChangePassword}
					>
						<Text style={styles.actionButtonText}>Change Password</Text>
						<MaterialIcons name="chevron-right" size={24} color="#888" />
					</TouchableOpacity>
				</View>

				{/* Two-Factor Authentication */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Two-Factor Authentication (2FA)</Text>
					<Text style={styles.cardContent}>
						Enable Two-Factor Authentication for an extra layer of security.
					</Text>
					<Switch
						value={is2FAEnabled}
						onValueChange={handleToggle2FA}
						trackColor={{ false: "#767577", true: "#71A12F" }}
						thumbColor={is2FAEnabled ? "#FFF" : "#f4f3f4"}
					/>
				</View>

				{/* Logout from All Devices */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Session Management</Text>
					<Text style={styles.cardContent}>
						Manage active sessions and log out from all devices.
					</Text>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleLogoutAll}
					>
						<Text style={styles.actionButtonText}>Logout from All Devices</Text>
						<MaterialIcons name="chevron-right" size={24} color="#888" />
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default Security;

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
		marginBottom: 12,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 8,
	},
	actionButtonText: {
		color: "#71A12F",
		fontSize: 16,
		fontWeight: "bold",
	},
});
