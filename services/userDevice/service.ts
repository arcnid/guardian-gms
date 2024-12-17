import { getSupabaseClient } from "@/services/supabaseClient";
import { linkDeviceToUser } from "./addDevice";

export const UserDeviceService = {
	// Create a new user device record
	addDevice: async ({ userId, deviceId, deviceName, status }) => {
		const client = getSupabaseClient();

		const { data, error } = await client
			.from("userdevices")
			.insert({
				user_id: userId,
				device_id: deviceId,
				device_name: deviceName,
				added_at: new Date().toISOString(), // Default added_at to current time
				status,
			})
			.single();

		if (error) {
			console.error("Error adding device:", error);
			throw error;
		}

		return data;
	},

	linkDeviceToUser: linkDeviceToUser,

	// Fetch all devices for a specific user
	getDevicesByUser: async (userId: string) => {
		const client = getSupabaseClient();

		const { data, error } = await client
			.from("userdevices")
			.select("*")
			.eq("user_id", userId);

		if (error) {
			console.error("Error fetching user devices:", error);
			throw error;
		}

		return data;
	},

	// Update a specific user device
	updateDevice: async ({
		device_id,
		deviceName,
		status,
	}: {
		device_id: string;
		deviceName: string;
		status: "Online" | "Offline";
	}) => {
		const client = getSupabaseClient();

		const { data, error } = await client
			.from("userdevices")
			.update({
				device_name: deviceName,
				status,
			})
			.eq("device_id", device_id)
			.single();

		if (error) {
			console.error("Error updating device:", error);
			throw error;
		}

		return data;
	},

	// Remove a user device
	removeDevice: async (id) => {
		const client = getSupabaseClient();

		const { data, error } = await client
			.from("userdevices")
			.delete()
			.eq("id", id)
			.single();

		if (error) {
			console.error("Error removing device:", error);
			throw error;
		}

		return data;
	},

	/**
	 * Get a device by device Id
	 * @param deviceId
	 * @returns
	 */
	getDevice: async (deviceId: string) => {
		const client = getSupabaseClient();

		const { data, error } = await client
			.from("userdevices")
			.select()
			.eq("device_id", deviceId)
			.single();

		if (error) {
			console.error("Error removing device:", error);
			throw error;
		}

		return data;
	},
};
