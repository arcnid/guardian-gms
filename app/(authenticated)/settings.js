// app/(authenticated)/settings.js
import React from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const settingsOptions = [
	{
		id: "1",
		title: "Profile",
		icon: "person",
	},
	{
		id: "2",
		title: "Notifications",
		icon: "notifications",
	},
	{
		id: "3",
		title: "Privacy",
		icon: "lock",
	},
	{
		id: "4",
		title: "Security",
		icon: "security",
	},
	{
		id: "5",
		title: "Language",
		icon: "language",
	},
	{
		id: "6",
		title: "Help & Support",
		icon: "help-outline",
	},
	{
		id: "7",
		title: "About",
		icon: "info-outline",
	},
];

const SettingsScreen = () => {
	const router = useRouter();

	const handleOptionPress = (option) => {
		console.log(`Selected option: ${option.title}`);
		// Navigate to the specific settings screen
		const routeName = option.title.toLowerCase().replace(/\s+/g, "-");
		router.push(`/settings/${routeName}`);
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<Text style={styles.header}>Settings</Text>
				{settingsOptions.map((option) => (
					<TouchableOpacity
						key={option.id}
						style={styles.card}
						onPress={() => handleOptionPress(option)}
					>
						<View style={styles.optionContainer}>
							<MaterialIcons
								name={option.icon}
								size={24}
								color="#71A12F"
								style={styles.icon}
							/>
							<Text style={styles.optionText}>{option.title}</Text>
						</View>
						<MaterialIcons name="chevron-right" size={24} color="#888" />
					</TouchableOpacity>
				))}
			</ScrollView>
		</SafeAreaView>
	);
};

export default SettingsScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5", // Match the layout background
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 30, // Extra padding to ensure content is above the tab bar
	},
	header: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 20,
		color: "#333",
		alignSelf: "center",
	},
	card: {
		backgroundColor: "#FFFFFF", // White card background
		borderRadius: 10, // Consistent border radius
		padding: 15,
		marginBottom: 15,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	optionContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	icon: {
		marginRight: 15,
	},
	optionText: {
		fontSize: 16,
		color: "#333",
	},
});
