import { getSupabaseClient } from "@/services/supabaseClient";

export const NotificationService = {
	/**
	 * Retrieve all notification records for the given user.
	 * @param {Object} params
	 * @param {string} params.userId - The ID of the user.
	 * @returns {Promise<Array>} List of notification records.
	 */
	getNotifications: async ({ userId }) => {
		const supabase = getSupabaseClient();
		const { data, error } = await supabase
			.from("notifications")
			.select("*")
			.eq("user_id", userId);

		if (error) {
			console.error("Error fetching notifications:", error);
			throw error;
		}

		return data;
	},

	/**
	 * Add or update the device's Expo push token for notifications.
	 * Uses an upsert to either insert a new record or update the existing one
	 * based on the user_id.
	 *
	 * @param {Object} params
	 * @param {string} params.userId - The ID of the user.
	 * @param {string} params.expoPushToken - The Expo push token for the device.
	 * @returns {Promise<Object>} The inserted/updated record.
	 */
	addDeviceToNotification: async ({ userId, expoPushToken }) => {
		const supabase = getSupabaseClient();
		const { data, error } = await supabase
			.from("notifications")
			.upsert(
				{
					user_id: userId,
					expo_push_token: expoPushToken,
				},
				{ onConflict: "user_id" } // update the record if user_id already exists
			)
			.select();

		if (error) {
			console.error("Error adding device to notifications:", error);
			throw error;
		}

		return data;
	},
};

export default NotificationService;
