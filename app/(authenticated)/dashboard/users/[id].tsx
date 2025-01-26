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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "@/contexts/AuthContext";
import BackButton from "@/components/BackButton";
import { AuthService } from "@/services/authService";

const ProfileScreen = () => {
	const router = useRouter();
	const { logout } = useContext(AuthContext);
	const [userData, setUserData] = useState(null); // User data state
	const [loading, setLoading] = useState(true); // Loading state
	const [error, setError] = useState(null); // Error state
	const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
	const [isDarkMode, setIsDarkMode] = useState(false);

	// Function to fetch user data
	const fetchUserData = useCallback(async () => {
		try {
			setError(null);
			console.log("Attempting to fetch user data...");
			const { data } = await AuthService.getCurrentUser();
			console.log("Fetched User Data:", data); // Debugging log
			if (data && data.user) {
				setUserData(data.user);
				console.log("User data set successfully.");
			} else {
				console.warn("User data is missing in the response.");
				setError("User data is incomplete.");
			}
		} catch (err) {
			console.error("Error fetching user data:", err);
			setError("Failed to load user data. Please try again.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

	// Optional: Alert if user_metadata is missing
	useEffect(() => {
		if (!loading && userData && !userData.user_metadata) {
			Alert.alert(
				"Incomplete Profile",
				"Your profile information is incomplete. Please update your profile.",
				[
					{
						text: "Update Profile",
						onPress: handleEditProfile,
					},
					{
						text: "Cancel",
						style: "cancel",
					},
				]
			);
		}
	}, [loading, userData]);

	// Handle logout
	const handleLogout = async () => {
		try {
			console.log("Initiating logout...");
			await logout(); // Clear authentication state
			console.log("Logout successful. Redirecting to login.");
			router.replace("/login"); // Redirect to Login screen
		} catch (err) {
			console.error("Error during logout:", err);
			Alert.alert("Error", "Failed to log out. Please try again.");
		}
	};

	// Handle navigation to edit profile
	const handleEditProfile = () => {
		// Navigate to the Edit Profile screen or show a placeholder
		console.log("Navigating to Edit Profile screen.");
		Alert.alert(
			"Edit Profile",
			"This will navigate to the Edit Profile screen."
		);
		// Example navigation:
		// router.push("/edit-profile");
	};

	// Handle navigation to change password
	const handleChangePassword = () => {
		// Navigate to the Change Password screen or show a placeholder
		console.log("Navigating to Change Password screen.");
		Alert.alert(
			"Change Password",
			"This will navigate to the Change Password screen."
		);
		// Example navigation:
		// router.push("/change-password");
	};

	// Handle toggling notifications
	const toggleNotifications = () => {
		setIsNotificationsEnabled((previousState) => !previousState);
		console.log(
			`Notifications have been ${!isNotificationsEnabled ? "enabled" : "disabled"}.`
		);
		Alert.alert(
			"Notifications",
			`Notifications have been ${
				!isNotificationsEnabled ? "enabled" : "disabled"
			}.`,
			[{ text: "OK" }]
		);
		// Optionally, persist this preference using AsyncStorage or update your backend
	};

	// Handle toggling dark mode
	const toggleDarkMode = () => {
		setIsDarkMode((previousState) => !previousState);
		console.log(`Dark mode has been ${!isDarkMode ? "enabled" : "disabled"}.`);
		Alert.alert(
			"Dark Mode",
			`Dark mode has been ${!isDarkMode ? "enabled" : "disabled"}.`,
			[{ text: "OK" }]
		);
		// Optionally, implement actual theme changes
	};

	if (loading) {
		console.log("Loading user data...");
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#71A12F" />
			</SafeAreaView>
		);
	}

	if (error) {
		console.log("Error state reached:", error);
		return (
			<SafeAreaView style={styles.errorContainer}>
				<Text style={styles.errorText}>{error}</Text>
				<TouchableOpacity onPress={fetchUserData} style={styles.retryButton}>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</SafeAreaView>
		);
	}

	console.log("Rendering user data on ProfileScreen.");

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.headerContainer}>
				<BackButton />
				<View style={{ width: 24 }} />
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.userInfoContainer}>
					<Image
						source={{
							uri:
								userData?.user_metadata?.avatar_url ||
								"https://via.placeholder.com/150",
						}}
						style={styles.avatar}
					/>
					<Text style={styles.userName}>
						{userData?.user_metadata?.full_name ||
							userData?.email?.split("@")[0] ||
							"User"}
					</Text>
					<Text style={styles.userEmail}>
						{userData?.email || "email@example.com"}
					</Text>
					<TouchableOpacity
						onPress={handleEditProfile}
						style={styles.editProfileButton}
					>
						<MaterialIcons name="edit" size={20} color="#FFFFFF" />
						<Text style={styles.editProfileButtonText}>Edit Profile</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.settingsContainer}>
					<Text style={styles.sectionTitle}>Settings</Text>

					<TouchableOpacity
						onPress={handleChangePassword}
						style={styles.settingItem}
					>
						<MaterialIcons name="lock" size={24} color="#71A12F" />
						<Text style={styles.settingText}>Change Password</Text>
						<MaterialIcons name="chevron-right" size={24} color="#666" />
					</TouchableOpacity>

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

				<TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
					<Text style={styles.logoutButtonText}>Log Out</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
};

export default ProfileScreen;

// Stylesheet remains unchanged
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
