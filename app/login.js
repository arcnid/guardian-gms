// app/login.js
import React, { useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons"; // Import icon library
import styles from "./styles/styles";

const LoginScreen = () => {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const handleLogin = () => {
		if (username === "user" && password === "password") {
			router.replace("/dashboard");
		} else {
			Alert.alert("Login Failed", "Invalid username or password.");
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

				<TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
					<Text style={styles.buttonText}>Login</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default LoginScreen;
