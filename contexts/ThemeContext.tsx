// contexts/ThemeContext.js
import React, { createContext, useState, useContext, useMemo } from "react";
import { Appearance } from "react-native";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
	// Detect system color scheme
	const colorScheme = Appearance.getColorScheme();

	const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");

	const toggleTheme = () => {
		setIsDarkMode((prevMode) => !prevMode);
	};

	// Define light and dark themes
	const theme = useMemo(
		() => ({
			isDarkMode,
			colors: isDarkMode
				? {
						background: "#023334", // Dark Teal
						card: "#71A33D", // Green
						text: "#99CC33", // Light Green
						border: "#000000", // Black
						primary: "#71A33D",
						secondary: "#99CC33",
						error: "#F44336",
						modalBackground: "rgba(0, 0, 0, 0.5)",
						white: "#FFFFFF",
						gray: "#CCCCCC",
						lightGray: "#F5F5F5",
					}
				: {
						background: "#F5F5F5", // Light Gray
						card: "#FFFFFF", // White
						text: "#000000", // Black
						border: "#E0E0E0", // Light Border
						primary: "#71A12F",
						secondary: "#4CAF50",
						error: "#F44336",
						modalBackground: "rgba(0, 0, 0, 0.5)",
						white: "#FFFFFF",
						gray: "#CCCCCC",
						lightGray: "#F5F5F5",
					},
		}),
		[isDarkMode]
	);

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

// Custom hook for easy access to the ThemeContext
export const useTheme = () => useContext(ThemeContext);
