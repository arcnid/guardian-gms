import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [isLoggedIn, setIsLoggedIn] = useState(null);
	const [user, setUser] = useState(null);

	// Login function using Supabase
	const login = async (email, password) => {
		try {
			const { user, session } = await AuthService.signIn(email, password);

			const token = session?.access_token;

			if (token) {
				await AsyncStorage.setItem("authToken", token);
				setIsLoggedIn(true);

				setUser(user.user);
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
			setIsLoggedIn(false);
			setUser(null);
		} catch (error) {
			console.error("Logout error:", error.message);
		}
	};

	// Check login status on app load
	useEffect(() => {
		const checkLoginStatus = async () => {
			try {
				const token = await AsyncStorage.getItem("authToken");
				if (token) {
					const { user } = await AuthService.getCurrentUser(); // Fetch the current user
					setIsLoggedIn(true);
					setUser(user);
				} else {
					setIsLoggedIn(false);
				}
			} catch (error) {
				console.error("Error checking login status:", error.message);
				setIsLoggedIn(false);
			}
		};

		checkLoginStatus();
	}, []);

	return (
		<AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
