// app/_layout.js
import React, { useState } from "react";
import { Stack } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import AppLoading from "expo-app-loading";

const Layout = () => {
	const router = useRouter();
	const [drawerVisible, setDrawerVisible] = useState(false);

	// Load the Geist font
	const [fontsLoaded] = useFonts({
		Geist: require("../fonts/Geist-Medium.ttf"), // Adjust if your file has a different name
	});

	if (!fontsLoaded) {
		return <AppLoading />;
	}

	const toggleDrawer = () => {
		setDrawerVisible(!drawerVisible);
	};

	const navigateTo = (route) => {
		setDrawerVisible(false); // Close the drawer
		router.push(route); // Navigate to the selected route
	};

	return (
		<>
			{/* Main Stack Navigator */}
			<Stack
				screenOptions={{
					headerStyle: { backgroundColor: "#71A12F" },
					headerTintColor: "#fff",
					headerTitleStyle: { fontWeight: "bold", fontFamily: "Geist" }, // Set font here for headers
					headerLeft: () => (
						<TouchableOpacity
							onPress={toggleDrawer}
							style={styles.hamburgerButton}
						>
							<Text style={styles.hamburgerIcon}>☰</Text> {/* Hamburger Icon */}
						</TouchableOpacity>
					),
				}}
			>
				{/* Stack Navigator manages all screens */}
			</Stack>

			{/* Custom Drawer Modal */}
			<Modal
				transparent={true}
				animationType="slide"
				visible={drawerVisible}
				onRequestClose={toggleDrawer}
			>
				<View style={styles.drawerContainer}>
					<Text style={styles.drawerTitle}>Menu</Text>
					<TouchableOpacity onPress={() => navigateTo("/")}>
						<Text style={styles.drawerItem}>Home</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => navigateTo("/login")}>
						<Text style={styles.drawerItem}>Login</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => navigateTo("/dashboard")}>
						<Text style={styles.drawerItem}>Dashboard</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
						<Text style={styles.closeButtonText}>Close Menu</Text>
					</TouchableOpacity>
				</View>
			</Modal>
		</>
	);
};

export default Layout;

const styles = StyleSheet.create({
	hamburgerButton: {
		padding: 10,
	},
	hamburgerIcon: {
		fontSize: 24,
		color: "#fff",
		fontFamily: "Geist", // Apply font here
	},
	drawerContainer: {
		flex: 1,
		backgroundColor: "#fff",
		paddingTop: 50,
		paddingHorizontal: 20,
	},
	drawerTitle: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 20,
		fontFamily: "Geist", // Apply font here
	},
	drawerItem: {
		fontSize: 18,
		marginVertical: 10,
		color: "#6200EE",
		fontFamily: "Geist", // Apply font here
	},
	closeButton: {
		marginTop: 30,
		padding: 10,
		alignItems: "center",
	},
	closeButtonText: {
		fontSize: 16,
		color: "red",
		fontFamily: "Geist", // Apply font here
	},
});
