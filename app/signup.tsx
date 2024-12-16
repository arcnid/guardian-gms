import React, { useState, useContext } from "react";
import {
	View,
	Text,
	TextInput,
	Alert,
	TouchableOpacity,
	ActivityIndicator,
	StyleSheet,
	Platform,
	Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";

const SignupScreen = () => {
	const router = useRouter();
	const { signUp } = useContext(AuthContext); // Assuming AuthContext provides signUp
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSignUp = async () => {
		if (!email || !password || !confirmPassword) {
			Alert.alert("Missing Fields", "Please fill in all the fields.");
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert("Password Mismatch", "Passwords do not match.");
			return;
		}

		setLoading(true);

		try {
			await signUp(email, password);

			Alert.alert("Success", "Account created successfully!");

			// Redirect to login or dashboard
			setTimeout(() => {
				router.replace({ pathname: "/dashboard" });
			}, 0);
		} catch (error: any) {
			console.error("Signup error:", error.message);
			Alert.alert(
				"Signup Failed",
				error.message || "An error occurred during signup."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.card}>
				{/* Header Container */}
				<View style={styles.header}>
					<Image
						style={styles.bannerImage}
						source={require("@/assets/images/guardian-banner.png")}
					/>
				</View>

				{/* Input Fields */}
				<View style={styles.inputContainer}>
					<MaterialIcons
						name="email"
						size={24}
						color="#71A12F"
						style={styles.icon}
					/>
					<TextInput
						style={[styles.input, Platform.OS === "web" && styles.webInput]}
						placeholder="Email"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
						placeholderTextColor="#888"
					/>
				</View>

				<View style={styles.inputContainer}>
					<MaterialIcons
						name="lock"
						size={24}
						color="#71A12F"
						style={styles.icon}
					/>
					<TextInput
						style={[styles.input, Platform.OS === "web" && styles.webInput]}
						placeholder="Password"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						placeholderTextColor="#888"
					/>
				</View>

				<View style={styles.inputContainer}>
					<MaterialIcons
						name="lock-outline"
						size={24}
						color="#71A12F"
						style={styles.icon}
					/>
					<TextInput
						style={[styles.input, Platform.OS === "web" && styles.webInput]}
						placeholder="Confirm Password"
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						secureTextEntry
						placeholderTextColor="#888"
					/>
				</View>

				{/* Signup Button */}
				<TouchableOpacity
					onPress={handleSignUp}
					style={styles.signupButton}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<Text style={styles.buttonText}>Sign Up</Text>
					)}
				</TouchableOpacity>

				{/* Navigate to Login */}
				<TouchableOpacity
					onPress={() => router.push("/login")}
					style={styles.navigateButton}
				>
					<Text style={styles.navigateText}>
						Already have an account? Login
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 10, // Reduced padding
		backgroundColor: "#F5F5F5", // Light grey background
	},
	card: {
		width: "90%",
		padding: 20,
		backgroundColor: "#fff",
		borderRadius: 10,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	header: {
		alignItems: "center",
		marginBottom: 20, // Space between header and inputs
	},
	bannerImage: {
		width: "95%", // Fixed width
		height: 100, // Fixed height to maintain aspect ratio
		resizeMode: "contain", // Ensures the entire image fits within the container without distortion
		marginBottom: 0, // Space below the image
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 5, // Space between title and subtitle
	},
	titleSmall: {
		fontSize: 14,
		textAlign: "center",
		marginBottom: 20, // Space below the subtitle
		color: "#555", // Slightly darker text
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		paddingHorizontal: 10,
		backgroundColor: "#fff", // White background for input fields
	},
	icon: {
		marginRight: 10,
	},
	input: {
		flex: 1,
		height: 40,
		color: "#333",
	},
	webInput: {
		outlineStyle: "none", // Removes the outline specifically for web
	} as any,
	signupButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 12, // Slightly increased padding for better touch area
		borderRadius: 10,
		alignItems: "center",
		marginTop: 10, // Added margin to separate from inputs
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	navigateButton: {
		marginTop: 15,
		alignItems: "center",
	},
	navigateText: {
		color: "#71A12F",
		textDecorationLine: "underline",
		fontSize: 14,
	},
});

export default SignupScreen;
