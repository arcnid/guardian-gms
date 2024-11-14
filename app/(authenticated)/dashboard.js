// app/(authenticated)/dashboard.js
import React, { useContext } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Image,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext"; // Adjust the path if necessary
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardScreen = () => {
	const { logout } = useContext(AuthContext);
	const router = useRouter();

	const handleLogout = async () => {
		await logout(); // Clear authentication state
		router.replace("/login"); // Redirect to Login screen
	};

	// Mock data for summary cards
	const summaryData = [
		{
			id: "1",
			title: "Total Devices",
			count: "4",
			icon: "devices",
			color: "#71A12F",
		},
		{
			id: "2",
			title: "Online",
			count: "2",
			icon: "check-circle",
			color: "#4CAF50",
		},
		{
			id: "3",
			title: "Offline",
			count: "2",
			icon: "highlight-off",
			color: "#F44336",
		},
	];

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<Text style={styles.header}>Welcome, User!</Text>

				{/* Summary Cards */}
				<View style={styles.summaryContainer}>
					{summaryData.map((item) => (
						<View key={item.id} style={styles.summaryCard}>
							<MaterialIcons name={item.icon} size={30} color={item.color} />
							<Text style={styles.summaryCount}>{item.count}</Text>
							<Text style={styles.summaryTitle}>{item.title}</Text>
						</View>
					))}
				</View>

				{/* Featured Device */}
				<View style={styles.featuredCard}>
					<Text style={styles.featuredTitle}>Featured Device</Text>
					<View style={styles.featuredContent}>
						<Image
							source={{
								uri: "https://via.placeholder.com/100",
							}}
							style={styles.deviceImage}
						/>
						<View style={styles.deviceInfo}>
							<Text style={styles.deviceName}>Device 1</Text>
							<Text style={styles.deviceStatus}>Online</Text>
						</View>
					</View>
				</View>

				{/* Logout Button */}
				<TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
					<Text style={styles.buttonText}>Log Out</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
};

export default DashboardScreen;

// Stylesheet
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5", // Match the layout background
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 30, // Extra padding to ensure content is above the tab bar
	},
	header: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 20,
		color: "#333",
		alignSelf: "center",
	},
	summaryContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	summaryCard: {
		backgroundColor: "#FFFFFF", // White card background
		borderRadius: 10, // Consistent border radius
		padding: 20, // Increased padding for better spacing
		alignItems: "center",
		flex: 1,
		marginHorizontal: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	summaryCount: {
		fontSize: 24,
		fontWeight: "bold",
		marginTop: 10,
		color: "#333",
	},
	summaryTitle: {
		fontSize: 14,
		color: "#666",
		marginTop: 5,
	},
	featuredCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	featuredTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
	},
	featuredContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	deviceImage: {
		width: 60,
		height: 60,
		borderRadius: 30,
		marginRight: 15,
	},
	deviceInfo: {
		flex: 1,
	},
	deviceName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
	},
	deviceStatus: {
		fontSize: 14,
		color: "#888",
	},
	logoutButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 10,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
});
