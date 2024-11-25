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
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";

const LoginScreen = () => {
	const router = useRouter();
	const { login } = useContext(AuthContext);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		if (!username || !password) {
			Alert.alert("Missing Fields", "Please enter both username and password.");
			return;
		}

		setLoading(true);

		try {
			await login(username, password);

			// Redirect to dashboard - without the use of setTimeout, the router will not navigate
			setTimeout(() => {
				router.replace({ pathname: "/dashboard" });
			}, 0);
		} catch (error: any) {
			console.error("Login error:", error.message);
			Alert.alert(
				"Login Failed",
				error.message || "Invalid username or password."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.card}>
				<Text style={styles.title}>Guardian</Text>
				<Text style={styles.titleSmall}>Grain Management System</Text>

				<View style={styles.inputContainer}>
					<MaterialIcons
						name="person"
						size={24}
						color="#71A12F"
						style={styles.icon}
					/>
					<TextInput
						style={[styles.input, Platform.OS === "web" && styles.webInput]}
						placeholder="Username"
						value={username}
						onChangeText={setUsername}
						autoCapitalize="none"
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

				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						marginBottom: 10,
					}}
				>
					<Text>Remember Me?</Text>
					<Text style={styles.forgotPassword}>Forgot password?</Text>
				</View>

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
			</View>
		</View>
	);
};

export default LoginScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
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
	title: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 10,
	},
	titleSmall: {
		fontSize: 14,
		textAlign: "center",
		marginBottom: 20,
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
	loginButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
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
});
