import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const BackButton = ({ label = "Back" }) => {
	const navigation = useNavigation();

	return (
		<TouchableOpacity
			style={styles.backButton}
			onPress={() => navigation.goBack()} // Navigate back to the previous screen
		>
			<MaterialIcons name="chevron-left" size={24} color="#71A12F" />
			<Text style={styles.backButtonText}>{label}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	backButton: {
		flexDirection: "row", // Align icon and text in a row
		alignItems: "center",
		marginLeft: -5,
		marginBottom: 20,
		alignSelf: "flex-start",
	},
	backButtonText: {
		color: "#71A12F",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 5, // Add spacing between icon and text
	},
});

export default BackButton;