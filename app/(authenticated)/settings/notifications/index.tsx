import React, { useState, useEffect, useContext } from "react";
import {
	Platform,
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import BackButton from "../../../../components/BackButton";
import * as Notifications from "expo-notifications";
import { AuthContext } from "@/contexts/AuthContext";

// Assume we have a notificationService to talk to our backend.
import notificationService from "@/services/notifications/service";

const NotificationsSettings = () => {
	const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
	const { userId } = useContext(AuthContext);

	// Set up a default notification channel for Android
	useEffect(() => {
		if (Platform.OS === "android") {
			Notifications.setNotificationChannelAsync("default", {
				name: "Default",
				importance: Notifications.AndroidImportance.DEFAULT,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: "#FF231F7C",
			}).catch((error) => {
				console.error("Error setting notification channel", error);
			});
		}
	}, []);

	// Request permission, get the Expo push token, and register it.
	const handleEnableNotifications = async () => {
		try {
			// Check current permissions.
			const { status } = await Notifications.getPermissionsAsync();
			let finalStatus = status;

			// Request permission if not already granted.
			if (status !== "granted") {
				const { status: newStatus } =
					await Notifications.requestPermissionsAsync();
				finalStatus = newStatus;
			}

			if (finalStatus !== "granted") {
				Alert.alert(
					"Permission Denied",
					"You can enable notifications in your device settings."
				);
				return;
			}

			// Get the Expo push token for this device.
			const tokenResponse = await Notifications.getExpoPushTokenAsync();
			let expoPushToken = tokenResponse.data;
			console.log("Original Expo push token:", expoPushToken);

			// Clean the token if it includes the "ExponentPushToken[...]" wrapper.
			if (expoPushToken.startsWith("ExponentPushToken[")) {
				expoPushToken = expoPushToken
					.replace(/^ExponentPushToken\[/, "")
					.replace(/\]$/, "");
			}
			console.log("Cleaned Expo push token:", expoPushToken);

			// Register the device with the backend by storing the push token.
			// The service uses an upsert so if the token is already registered it will update it.
			const response = await notificationService.addDeviceToNotification({
				userId,
				expoPushToken,
			});

			// Based on the response, alert the user if the device was already set up or newly registered.
			if (response && response.alreadyRegistered) {
				Alert.alert(
					"Notifications Already Set Up",
					"Your device is already registered for notifications."
				);
			} else {
				Alert.alert(
					"Notifications Enabled",
					"Notifications have been enabled successfully!"
				);
			}

			// Update local state so the button is disabled.
			setIsNotificationsEnabled(true);
		} catch (error) {
			console.error("Error enabling notifications:", error);
			Alert.alert("Error", "An error occurred while enabling notifications.");
		}
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
		backgroundColor: "#F5F5F5",
	},
	header: {
		paddingHorizontal: 16,
		paddingTop: 8,
		backgroundColor: "#F5F5F5",
	},
	container: {
		padding: 16,
		paddingBottom: 32,
	},
	heading: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
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
		color: "#333",
		marginBottom: 8,
	},
	cardContent: {
		fontSize: 16,
		color: "#333",
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
