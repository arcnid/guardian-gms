// components/ThemedCard.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const ThemedCard = ({ children, style }) => {
	const { theme } = useTheme();

	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: theme.colors.card,
					borderColor: theme.colors.border,
				},
				style,
			]}
		>
			{children}
		</View>
	);
};

export default ThemedCard;

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 10,
		padding: 15,
		marginBottom: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
});
