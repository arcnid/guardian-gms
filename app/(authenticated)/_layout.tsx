// app/(authenticated)/_layout.js
import React, { useContext, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { AuthContext } from "../../contexts/AuthContext"; // Adjust path as needed
import { MaterialIcons } from "@expo/vector-icons";
import { initializeFirebase } from "@/services/notifications/firebaseConfig"; // Import initializeFirebase
import { setupNotificationChannel } from "@/services/notifications/notificationsSetup"; // Import setupNotificationChannel

const AuthenticatedLayout = () => {
	const authContext = useContext(AuthContext);
	const router = useRouter();

	// Error handling to ensure AuthContext is provided
	if (!authContext) {
		throw new Error("AuthContext must be used within an AuthProvider");
	}

	const { isLoggedIn } = authContext;

	useEffect(() => {
		// Initialize Firebase and set up notification channel
		// initializeFirebase();
		setupNotificationChannel();
	}, []);

	useEffect(() => {
		// Redirect to login if user is not authenticated
		if (isLoggedIn === false) {
			router.replace("/login");
		}
	}, [isLoggedIn, router]);

	useEffect(() => {
		// Handle case where isLoggedIn might remain null
		const timeout = setTimeout(() => {
			if (isLoggedIn === null) {
				console.error("Authentication status timeout. Redirecting to login.");
				router.replace("/login");
			}
		}, 5000); // 5 seconds timeout

		return () => clearTimeout(timeout);
	}, [isLoggedIn, router]);

	// Show a loading indicator while checking authentication status
	if (isLoggedIn === null) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#71A12F" />
			</View>
		);
	}

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#71A12F", // Active tab icon color
				tabBarStyle: {
					backgroundColor: "#f8f8f8",
					height: 70,
					paddingBottom: 5,
					borderTopWidth: 0,
				},
				tabBarLabelStyle: {
					display: "none", // Hide labels to show icons only
				},
				tabBarIconStyle: {
					alignSelf: "center",
				},
			}}
		>
			{/* Home Tab - Dashboard */}
			<Tabs.Screen
				name="dashboard"
				options={{
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name="home"
							color={color}
							size={focused ? size + 2 : size}
							accessibilityLabel="Home"
						/>
					),
				}}
				listeners={({ navigation }) => ({
					tabPress: (e) => {
						// Prevent default behavior
						e.preventDefault();
						// Navigate to the /devices route, resetting the stack
						router.replace("/dashboard");
					},
				})}
			/>

			{/* Locations Tab */}
			<Tabs.Screen
				name="locations"
				options={{
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name="location-on" // Icon name for Locations
							color={color}
							size={focused ? size + 2 : size}
							accessibilityLabel="Locations"
						/>
					),
				}}
				listeners={({ navigation }) => ({
					tabPress: (e) => {
						// Prevent default behavior
						e.preventDefault();
						// Navigate to the /locations route, resetting the stack
						router.replace("/locations");
					},
				})}
			/>

			{/* Devices Tab with tabPress Listener */}
			<Tabs.Screen
				name="devices"
				options={{
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name="devices"
							color={color}
							size={focused ? size + 2 : size}
							accessibilityLabel="Devices"
						/>
					),
				}}
				listeners={({ navigation }) => ({
					tabPress: (e) => {
						// Prevent default behavior
						e.preventDefault();
						// Navigate to the /devices route, resetting the stack
						router.replace("/devices");
					},
				})}
			/>

			{/* Settings Tab */}
			<Tabs.Screen
				name="settings"
				options={{
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name="settings"
							color={color}
							size={focused ? size + 2 : size}
							accessibilityLabel="Settings"
						/>
					),
				}}
				listeners={({ navigation }) => ({
					tabPress: (e) => {
						// Prevent default behavior
						e.preventDefault();
						// Navigate to the /devices route, resetting the stack
						router.replace("/settings");
					},
				})}
			/>

			{/* Add Device Tab */}
			<Tabs.Screen
				name="add-device"
				options={{
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialIcons
							name="add"
							color={color}
							size={focused ? size + 2 : size}
							accessibilityLabel="Add Device"
						/>
					),
				}}
			/>
		</Tabs>
	);
};

export default AuthenticatedLayout;

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f5f5f5",
	},
});
