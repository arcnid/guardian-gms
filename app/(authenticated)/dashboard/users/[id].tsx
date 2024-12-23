// app/(authenticated)/profile.js
import React, { useContext, useState, useCallback, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Image,
	Switch,
	Alert,
	ActivityIndicator,
	SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { AuthContext } from "@/contexts/AuthContext"; // Adjust the path if necessary
import BackButton from "@/components/BackButton"; // Ensure this component exists

const ProfileScreen = () => {
	const router = useRouter();
	const { userId, logout } = useContext(AuthContext);
	const { id } = useLocalSearchParams(); // If you're passing userId via route params
	const [userData, setUserData] = useState(null); // User data state
	const [loading, setLoading] = useState(true); // Loading state
	const [error, setError] = useState(null); // Error state
	const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
	const [isDarkMode, setIsDarkMode] = useState(false);

	// Function to fetch user data
	const fetchUserData = useCallback(async () => {
		try {
			setError(null);
			// Replace this with your actual user data fetching logic
			// For example:
			// const data = await UserService.getUserById(id || userId);
			// setUserData(data);

			// Mock data for demonstration
			const data = {
				id: id || userId,
				userName: "Jane Doe",
				userEmail: "janedoe@example.com",
				userAvatar: "https://via.placeholder.com/150",
			};
			setUserData(data);
		} catch (err) {
			console.error("Error fetching user data:", err);
			setError("Failed to load user data. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [id, userId]);

	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

	// Handle logout
	const handleLogout = async () => {
		await logout(); // Clear authentication state
		router.replace("/login"); // Redirect to Login screen
	};

	// Handle navigation to edit profile
	const handleEditProfile = () => {
		router.push("/edit-profile"); // Navigate to the Edit Profile screen
	};

	// Handle navigation to change password
	const handleChangePassword = () => {
		router.push("/change-password"); // Navigate to the Change Password screen
	};

	// Handle toggling notifications
	const toggleNotifications = () => {
		setIsNotificationsEnabled((previousState) => !previousState);
		Alert.alert(
			"Notifications",
			`Notifications have been ${!isNotificationsEnabled ? "enabled" : "disabled"}.`,
			[{ text: "OK" }]
		);
	};

	// Handle toggling dark mode
	const toggleDarkMode = () => {
		setIsDarkMode((previousState) => !previousState);
		Alert.alert(
			"Dark Mode",
			`Dark mode has been ${!isDarkMode ? "enabled" : "disabled"}.`,
			[{ text: "OK" }]
		);
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#71A12F" />
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={styles.errorContainer}>
				<Text style={styles.errorText}>{error}</Text>
				<TouchableOpacity onPress={fetchUserData} style={styles.retryButton}>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Header with Back Button */}
			<View style={styles.headerContainer}>
				<BackButton label="Dashboard" />
				{/* Placeholder for alignment */}
			</View>

			{/* Profile Content */}
			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* User Information */}
				<View style={styles.userInfoContainer}>
					<Image
						source={{
							uri: userData.userAvatar || "https://via.placeholder.com/150",
						}}
						style={styles.avatar}
					/>
					<Text style={styles.userName}>{userData.userName || "John Doe"}</Text>
					<Text style={styles.userEmail}>
						{userData.userEmail || "johndoe@example.com"}
					</Text>
					<TouchableOpacity
						onPress={handleEditProfile}
						style={styles.editProfileButton}
					>
						<MaterialIcons name="edit" size={20} color="#FFFFFF" />
						<Text style={styles.editProfileButtonText}>Edit Profile</Text>
					</TouchableOpacity>
				</View>

				{/* Settings */}
				<View style={styles.settingsContainer}>
					<Text style={styles.sectionTitle}>Settings</Text>

					{/* Change Password */}
					<TouchableOpacity
						onPress={handleChangePassword}
						style={styles.settingItem}
					>
						<MaterialIcons name="lock" size={24} color="#71A12F" />
						<Text style={styles.settingText}>Change Password</Text>
						<MaterialIcons name="chevron-right" size={24} color="#666" />
					</TouchableOpacity>

					{/* Notifications */}
					<View style={styles.settingItem}>
						<MaterialIcons name="notifications" size={24} color="#71A12F" />
						<Text style={styles.settingText}>Notifications</Text>
						<Switch
							trackColor={{ false: "#767577", true: "#71A12F" }}
							thumbColor={isNotificationsEnabled ? "#FFFFFF" : "#f4f3f4"}
							ios_backgroundColor="#3e3e3e"
							onValueChange={toggleNotifications}
							value={isNotificationsEnabled}
						/>
					</View>

					{/* Dark Mode */}
					<View style={styles.settingItem}>
						<MaterialIcons name="brightness-6" size={24} color="#71A12F" />
						<Text style={styles.settingText}>Dark Mode</Text>
						<Switch
							trackColor={{ false: "#767577", true: "#71A12F" }}
							thumbColor={isDarkMode ? "#FFFFFF" : "#f4f3f4"}
							ios_backgroundColor="#3e3e3e"
							onValueChange={toggleDarkMode}
							value={isDarkMode}
						/>
					</View>
				</View>

				{/* Logout Button */}
				<TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
					<Text style={styles.logoutButtonText}>Log Out</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
};

export default ProfileScreen;

// Stylesheet
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5", // Match the layout background
	},
	headerContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 10,
		paddingBottom: 0,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		marginLeft: -65,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 30, // Extra padding to ensure content is above the tab bar
	},
	userInfoContainer: {
		alignItems: "center",
		marginBottom: 30,
	},
	avatar: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "#E0E0E0",
		marginBottom: 15,
	},
	userName: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 5,
	},
	userEmail: {
		fontSize: 16,
		color: "#666",
		marginBottom: 15,
	},
	editProfileButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#71A12F",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	editProfileButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},
	settingsContainer: {
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		padding: 20,
		marginBottom: 30,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 15,
	},
	settingItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#E0E0E0",
	},
	settingText: {
		fontSize: 16,
		color: "#333",
		flex: 1,
		marginLeft: 10,
	},
	logoutButton: {
		backgroundColor: "#F44336",
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 10,
	},
	logoutButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: "#F44336",
		textAlign: "center",
		marginBottom: 15,
	},
	retryButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	retryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
});
