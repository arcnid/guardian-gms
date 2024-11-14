// Example AuthContext setup (simplified)
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [isLoggedIn, setIsLoggedIn] = useState(null);

	const login = async (token) => {
		await AsyncStorage.setItem("authToken", token);
		setIsLoggedIn(true);
	};

	const logout = async () => {
		await AsyncStorage.removeItem("authToken");
		setIsLoggedIn(false);
	};

	useEffect(() => {
		const checkLoginStatus = async () => {
			const token = await AsyncStorage.getItem("authToken");
			setIsLoggedIn(token ? true : false);
		};
		checkLoginStatus();
	}, []);

	return (
		<AuthContext.Provider value={{ isLoggedIn, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
