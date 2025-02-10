import { getSupabaseClient } from "./supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabase = getSupabaseClient();

export const AuthService = {
	signUp: async (email, password) => {
		const { data, error } = await supabase.auth.signUp({ email, password });
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
