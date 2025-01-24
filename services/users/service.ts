import { getSupabaseClient } from "@/services/supabaseClient";

export const UserService = {
	getUserById: async (userId: string) => {
		const client = getSupabaseClient();
		const { data, error } = await client
			.from("auth.users")
			.select("*")
			.eq("id", userId)
			.single();

		if (error) throw error;

		return data;
	},
};
