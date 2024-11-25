// app/_layout.js
import React from "react";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext"; // Adjust the path as necessary

const RootLayout = () => {
	return (
		<SafeAreaProvider>
			<AuthProvider>
				<Slot />
			</AuthProvider>
		</SafeAreaProvider>
	);
};

export default RootLayout;
