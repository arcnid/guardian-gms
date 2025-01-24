// services/actions/service.js
import { getSupabaseClient } from "@/services/supabaseClient";

export const ActionService = {
	// Fetch actions for a specific user
	getActionsForUser: async (userId) => {
		const supabase = getSupabaseClient();
		const { data, error } = await supabase
			.from("userautomations")
			.select("*")
			.eq("user_id", userId);

		if (error) throw error;

		return data;
	},

	// Add a new action (scheduled or triggered)
	addAction: async (actionData) => {
		const supabase = getSupabaseClient();
		const { data, error } = await supabase
			.from("userautomations")
			.insert([actionData]);

		if (error) throw error;

		return data;
	},

	// Remove an action by ID
	removeAction: async (actionId) => {
		const supabase = getSupabaseClient();
		const { data, error } = await supabase
			.from("userautomations")
			.delete()
			.eq("id", actionId);

		if (error) throw error;

		return data;
	},

	// You can add more methods like updateAction, etc.
};
