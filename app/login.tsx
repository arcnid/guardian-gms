// app/login.js (or wherever your LoginScreen is located)
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

const LoginScreen = () => {
	const router = useRouter();
	const { login } = useContext(AuthContext);
	const [email, setEmail] = useState(""); // Changed from username to email
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(false); // Added state for checkbox
	const [imageLoaded, setImageLoaded] = useState(false);

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Missing Fields", "Please enter both email and password.");
			return;
		}

		setLoading(true);

		try {
			await login(email, password); // Use email instead of username

			// Redirect to dashboard
			setTimeout(() => {
				router.replace({ pathname: "/dashboard" });
			}, 0);
		} catch (error: any) {
			console.error("Login error:", error.message);
			Alert.alert(
				"Login Failed",
				error.message || "Invalid email or password."
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
						keyboardType="email-address" // Enhanced for email input
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

				{/* Options */}
				<View style={styles.optionsContainer}>
					<View style={styles.rememberMeContainer}>
						<TouchableOpacity
							style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
							onPress={() => setRememberMe(!rememberMe)} // Toggle state
						>
							{rememberMe && (
								<MaterialIcons name="check" size={16} color="#fff" />
							)}
						</TouchableOpacity>
						<Text style={styles.rememberMeText}>Remember Me?</Text>
					</View>
					<TouchableOpacity
						onPress={() => {
							// Navigate to Forgot Password screen or handle accordingly
							Alert.alert("Forgot Password", "Feature not implemented");
						}}
					>
						<Text style={styles.forgotPassword}>Forgot password?</Text>
					</TouchableOpacity>
				</View>

				{/* Login Button */}
				<TouchableOpacity
					onPress={handleLogin}
					style={styles.loginButton}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<Text style={styles.buttonText}>Login</Text>
					)}
				</TouchableOpacity>

				{/* Signup Button */}
				<TouchableOpacity
					onPress={() => router.push("/signup")}
					style={styles.signupButton}
				>
					<Text style={styles.signupText}>Don't have an account? Sign Up</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.footerContainer}>
				<Image
					source={require("@/assets/images/ss-logo.png")}
					style={styles.ssLogo}
				/>
				<Text style={styles.footerText}>
					Powered by Sioux Steel {"\u00A9"} | v1.0.0{" "}
				</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		paddingTop: Platform.OS === "web" ? 240 : 215,
		alignItems: "center",
		padding: 10, // Reduced padding for better fit
		backgroundColor: "#fff", // Changed to white for seamless blend
	},
	card: {
		width: "90%",
		padding: 20,
		backgroundColor: "#fff",
		borderRadius: 10,
		// Removed elevation and shadow properties for seamless look
	},
	header: {
		alignItems: "center",
		marginBottom: 20, // Space between header and inputs
	},
	bannerImage: {
		width: "95%",
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
		color: "#555", // Slightly darker text for contrast
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
	optionsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	rememberMeContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 3,
		marginRight: 5,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	checkboxChecked: {
		backgroundColor: "#71A12F",
		borderColor: "#71A12F",
	},
	rememberMeText: {
		fontSize: 14,
		color: "#333",
	},
	loginButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 12, // Slightly increased padding for better touch area
		borderRadius: 10,
		alignItems: "center",
		marginTop: 10, // Added margin to separate from options
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	forgotPassword: {
		color: "#71A12F",
		textDecorationLine: "underline",
	},
	signupButton: {
		marginTop: 15,
		alignItems: "center",
	},
	signupText: {
		color: "#71A12F",
		textDecorationLine: "underline",
		fontSize: 14,
	},
	footerText: {
		fontSize: 12,
		color: "#888", // Light gray text
		textAlign: "center",
		marginTop: 15, // Space between Signup link and footer
	},
	ssLogo: {
		width: 60, // Adjust the width to fit the logo
		height: 60, // Adjust the height to match proportions
		marginRight: 8, // Spacing between logo and text
		resizeMode: "contain",
		alignContent: "center",
		justifyContent: "center",
		marginTop: 15,
	},
	footerContainer: {
		flexDirection: "row", // Horizontal layout
		alignItems: "center", // Align items vertically centered
		justifyContent: "center", // Center content horizontally
		marginTop: 150, // Spacing above
	},
	errorContainer: {
		padding: 16,
		backgroundColor: "#F8D7DA",
		borderRadius: 8,
		margin: 16,
	},
	errorText: {
		color: "#721C24",
		textAlign: "center",
	},
});

export default LoginScreen;
