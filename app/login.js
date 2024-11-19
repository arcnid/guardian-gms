import React, { useState, useContext } from "react";
import {
	View,
	Text,
	TextInput,
	Alert,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import styles from "./styles/styles";
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
				router.replace("/dashboard");
			}, 0);
		} catch (error) {
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
						style={styles.input}
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
						style={styles.input}
						placeholder="Password"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						placeholderTextColor="#888"
					/>
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
