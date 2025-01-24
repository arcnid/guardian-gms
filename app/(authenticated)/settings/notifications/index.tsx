import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import BackButton from "../../../../components/BackButton"; // Import BackButton
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";

const NotificationsSettings = () => {
	const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

	// Check and request notification permissions
	const handleEnableNotifications = async () => {
		try {
			const { status } = await Notifications.getPermissionsAsync();

			if (status === "granted") {
				Alert.alert("Notifications are already enabled.");
				setIsNotificationsEnabled(true);
				return;
			}

			const { status: newStatus } =
				await Notifications.requestPermissionsAsync();

			if (newStatus === "granted") {
				Alert.alert("Notifications enabled successfully!");
				setIsNotificationsEnabled(true);
			} else {
				Alert.alert(
					"Permission Denied",
					"You can enable notifications in your device settings."
				);
			}
		} catch (error) {
			console.error("Error enabling notifications:", error);
			Alert.alert("Error", "An error occurred while enabling notifications.");
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView style={styles.container}>
				{/* Reusable Back Button */}
				<BackButton label="Settings" />

				<Text style={styles.heading}>Notification Settings</Text>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Allow Notifications</Text>
					<Text style={styles.cardContent}>
						This application can send you notifications about important events
						and updates, such as temperature and humidity alerts, firmware
						updates, and other critical information.
					</Text>
					<TouchableOpacity
						style={[
							styles.enableButton,
							isNotificationsEnabled && styles.enableButtonDisabled,
						]}
						onPress={handleEnableNotifications}
						disabled={isNotificationsEnabled}
					>
						<MaterialIcons name="notifications" size={24} color="#FFF" />
						<Text style={styles.enableButtonText}>
							{isNotificationsEnabled ? "Enabled" : "Enable Notifications"}
						</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Why Notifications?</Text>
					<Text style={styles.cardContent}>
						Enabling notifications ensures you stay informed about:
					</Text>
					<View style={styles.listItem}>
						<MaterialIcons name="check-circle" size={20} color="#71A12F" />
						<Text style={styles.listText}>Temperature and humidity alerts</Text>
					</View>
					<View style={styles.listItem}>
						<MaterialIcons name="check-circle" size={20} color="#71A12F" />
						<Text style={styles.listText}>Firmware updates</Text>
					</View>
					<View style={styles.listItem}>
						<MaterialIcons name="check-circle" size={20} color="#71A12F" />
						<Text style={styles.listText}>Critical system warnings</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default NotificationsSettings;

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
	enableButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#71A12F",
		padding: 12,
		borderRadius: 8,
		marginTop: 16,
	},
	enableButtonDisabled: {
		backgroundColor: "#A5D6A7",
	},
	enableButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},
	listItem: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 4,
	},
	listText: {
		fontSize: 16,
		color: "#333",
		marginLeft: 8,
	},
});
