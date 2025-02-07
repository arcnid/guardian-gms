// app/_layout.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAssets } from "expo-asset";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { setupNotificationChannel } from "@/services/notifications/notificationsSetup";

const RootLayout = () => {
	const [assets] = useAssets([
		require("../assets/images/guardian-banner.png"),
		// Add other images or assets here if needed
	]);

	useEffect(() => {
		// console.log("starting notifications channel");
		// setupNotificationChannel();
	}, []); // run once when the app loads

	if (!assets) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#71A12F" />
			</View>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ThemeProvider>
				<SafeAreaProvider>
					<AuthProvider>
						<Slot />
					</AuthProvider>
				</SafeAreaProvider>
			</ThemeProvider>
		</GestureHandlerRootView>
	);
};

export default RootLayout;

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F5F5F5",
	},
});
