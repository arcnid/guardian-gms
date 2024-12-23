// components/ThemedButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const ThemedButton = ({ onPress, title, disabled }) => {
	const { theme } = useTheme();

	return (
		<TouchableOpacity
			onPress={onPress}
			style={[
				styles.button,
				{
					backgroundColor: disabled ? theme.colors.gray : theme.colors.primary,
				},
			]}
			disabled={disabled}
		>
			<Text style={[styles.buttonText, { color: theme.colors.text }]}>
				{title}
			</Text>
		</TouchableOpacity>
	);
};

export default ThemedButton;

const styles = StyleSheet.create({
	button: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 10,
		flexDirection: "row",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "bold",
	},
});
