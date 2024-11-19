import "dotenv/config"; // Automatically loads variables from .env

export default {
	expo: {
		name: "guardian-gms",
		slug: "guardian-gms",
		version: "1.0.0",
		extra: {
			SUPABASE_URL: process.env.SUPABASE_URL,
			SUPABASE_KEY: process.env.SUPABASE_ANON_KEY,
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
			supportsTablet: true,
		},
		android: {
			adaptiveIcon: {
				foregroundImage: "./assets/images/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
		},
		web: {
			bundler: "metro",
			output: "single",
			favicon: "./assets/images/favicon.png",
		},
		plugins: ["expo-router", "expo-font"],
		experiments: {
			typedRoutes: true,
		},
	},
};