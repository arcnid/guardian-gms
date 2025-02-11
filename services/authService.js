import { getSupabaseClient } from "./supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabase = getSupabaseClient();

export const AuthService = {
	signUp: async (email, password) => {
		console.log("tring to sign up");
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});

		console.log("data", data);
		if (error) throw error;
		return data.user;
	},

	signIn: async (email, password) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) throw error;
		return data;
	},

	signOut: async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
		return true;
	},

	getCurrentUser: async () => {
		return await supabase.auth.getUser();
	},

	resetPassword: async (email) => {
		const { data, error } = await supabase.auth.resetPasswordForEmail(email);
		if (error) throw error;
		return data;
	},
};
