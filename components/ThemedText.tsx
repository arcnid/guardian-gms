// components/ThemedText.js
import React from "react";
import { Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const ThemedText = ({ children, style, ...props }) => {
	const { theme } = useTheme();

	return (
		<Text style={[styles.text, { color: theme.colors.text }, style]} {...props}>
			{children}
		</Text>
	);
};

export default ThemedText;

const styles = StyleSheet.create({
	text: {
		fontSize: 16,
	},
});
