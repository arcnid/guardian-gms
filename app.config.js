import { GoogleMapsApiKey } from "@expo/config-plugins/build/android";
import "dotenv/config"; // Automatically loads variables from .env

export default {
	expo: {
		name: "guardian-gms",
		slug: "guardian-gms",
		version: "1.0.0",
		extra: {
			SUPABASE_URL: process.env.SUPABASE_URL,
			SUPABASE_KEY: process.env.SUPABASE_ANON_KEY,
			hostURL: process.env.hostURL,
			eas: {
				projectId: "868c5333-a463-4787-8488-03f595dc677f",
			},
		},

		orientation: "portrait",
		icon: "./assets/images/icon.png",
		scheme: "myapp",
		userInterfaceStyle: "automatic",
		splash: {
			image: "./assets/images/splash.png",
			resizeMode: "contain",
			backgroundColor: "#ffffff",
		},
		ios: {
			bundleIdentifier: "com.siouxsteel.guardian", // Unique identifier for iOS
			supportsTablet: true,
		},
		android: {
			package: "com.siouxsteel.guardianandroid", // Unique identifier for Android
			adaptiveIcon: {
				foregroundImage: "./assets/images/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			googleMapsApiKey: "AIzaSyB64Xzy1HRz_zhdms_2-CMJgmpda3qjKp8",
		},
		web: {
			bundler: "metro",
			output: "single",
			favicon: "./assets/images/favicon.png",
		},
		plugins: ["expo-router", "expo-font", "expo-notifications"],
		experiments: {
			typedRoutes: true,
		},
	},
};
