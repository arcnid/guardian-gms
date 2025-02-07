import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const setupNotificationChannel = async () => {
	if (Platform.OS === "android") {
		try {
			await Notifications.setNotificationChannelAsync("default", {
				name: "Default",
				importance: Notifications.AndroidImportance.HIGH,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: "#FF231F7C",
				sound: true,
			});
			console.log("Notification channel set up successfully.");
		} catch (error) {
			console.error("Error setting up notification channel:", error);
		}
	}
};
