// app/index.js
import React, { useEffect, useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../contexts/AuthContext"; // Adjust the path if necessary
import { ThemeContext } from "@/contexts/ThemeContext";

const Index = () => {
	const router = useRouter();
	const { isLoggedIn } = useContext(AuthContext);

	useEffect(() => {
		if (isLoggedIn === false) {
			// User is not logged in, redirect to Login screen
			router.replace("/login");
		} else if (isLoggedIn === true) {
			// User is logged in, redirect to Dashboard
			router.replace("/dashboard");
		}
		// If isLoggedIn is null, do nothing (handled in Layout)
	}, [isLoggedIn]);

	return (
		<View style={styles.container}>
			{/* Optionally, add a loading indicator or splash screen content here */}
		</View>
	);
};

export default Index;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		backgroundColor: "#fff",
	},
	text: {
		fontSize: 24,
		fontFamily: "Geist",
		color: "#71A12F",
		textAlign: "center",
	},
});
