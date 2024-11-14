// app/(authenticated)/_layout.js
import React, { useContext, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { AuthContext } from "../../contexts/AuthContext"; // Adjust path as needed
import { MaterialIcons } from "@expo/vector-icons";

const AuthenticatedLayout = () => {
	const { isLoggedIn } = useContext(AuthContext);
	const router = useRouter();

	useEffect(() => {
		// Redirect to login if user is not authenticated
		if (isLoggedIn === false) {
			router.replace("/login");
		}
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
					tabBarIcon: ({ color, size }) => (
						<MaterialIcons name="home" color={color} size={size} />
					),
				}}
			/>

			{/* Devices Tab */}
			<Tabs.Screen
				name="devices"
				options={{
					tabBarIcon: ({ color, size }) => (
						<MaterialIcons name="devices" color={color} size={size} />
					),
				}}
			/>

			{/* Settings Tab */}
			<Tabs.Screen
				name="settings"
				options={{
					tabBarIcon: ({ color, size }) => (
						<MaterialIcons name="settings" color={color} size={size} />
					),
				}}
			/>

			{/* Add Device Tab */}
			<Tabs.Screen
				name="add-device"
				options={{
					tabBarIcon: ({ color, size }) => (
						<MaterialIcons name="add" color={color} size={size} />
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
