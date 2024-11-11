// app/login.js
import React from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import styles from "./styles/styles";

const LoginScreen = () => {
	const router = useRouter();

	return (
		<View style={styles.container}>
			<View style={styles.card}>
				<Text style={styles.title}>Guardian GMS</Text>
				<TouchableOpacity
					style={styles.loginButton}
					onPress={() => router.push("/login")}
				>
					<Text style={styles.buttonText}>Login</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default LoginScreen;
