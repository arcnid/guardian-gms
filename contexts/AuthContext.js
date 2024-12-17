import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [isLoggedIn, setIsLoggedIn] = useState(null);
	const [user, setUser] = useState(null);
	const [userId, setUserId] = useState(null);

	// Login function using Supabase
	const login = async (email, password) => {
		try {
			const { user, session } = await AuthService.signIn(email, password);

			const token = session?.access_token;

			if (token) {
				await AsyncStorage.setItem("authToken", token);
				await AsyncStorage.setItem("userId", user?.id); // Save userId to AsyncStorage
				setIsLoggedIn(true);
				setUser(user);
				setUserId(user?.id); // Set the userId from the returned user object
			} else {
				throw new Error("Invalid token");
			}
		} catch (error) {
			console.error("Login error:", error.message);
			throw error;
		}
	};

	// Logout function using Supabase
	const logout = async () => {
		try {
			await AuthService.signOut();
			await AsyncStorage.removeItem("authToken");
			await AsyncStorage.removeItem("userId"); // Clear userId from AsyncStorage
			setIsLoggedIn(false);
			setUser(null);
			setUserId(null); // Clear the userId in state
		} catch (error) {
			console.error("Logout error:", error.message);
		}
	};

	// Check login status on app load
	useEffect(() => {
		const checkLoginStatus = async () => {
			try {
				const token = await AsyncStorage.getItem("authToken");
				const storedUserId = await AsyncStorage.getItem("userId"); // Get the userId from AsyncStorage

				if (token && storedUserId) {
					const { user } = await AuthService.getCurrentUser(); // Fetch the current user
					setIsLoggedIn(true);
					setUser(user);
					setUserId(storedUserId); // Set the userId from AsyncStorage
				} else {
					setIsLoggedIn(false);
					setUserId(null);
				}
			} catch (error) {
				console.error("Error checking login status:", error.message);
				setIsLoggedIn(false);
				setUserId(null);
			}
		};

		checkLoginStatus();
	}, []);

	return (
		<AuthContext.Provider value={{ isLoggedIn, user, userId, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
