import { getSupabaseClient } from "@/services/supabaseClient";
import { DateTime } from "luxon";
import { linkDeviceToUser } from "./addDevice";

type HistoryOption = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
interface GetDeviceLogsParams {
	deviceId: string; // Use `string`, not `String`
	option: HistoryOption;
}

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

		console.log("trying to find", deviceId);

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

	getRecentLogs: async (deviceId: string) => {
		const client = getSupabaseClient();

		const { data, error } = await client
			.from("deviceLogs")
			.select("*")
			.eq("device_id", deviceId)
			.order("created_at", { ascending: false })
			.limit(5);

		if (error) {
			console.error("Error fetching recent logs:", error);
			throw error;
		}

		return data;
	},

	getDeviceLogs: async ({ deviceId, option }: GetDeviceLogsParams) => {
		const client = getSupabaseClient();

		console.log("Fetching logs with option:", option);

		// Calculate 'fromDate' in YYYY-MM-DD format
		const now = DateTime.utc();
		let fromDate: string | null = null;

		switch (option) {
			case "1D":
				fromDate = now.minus({ days: 1 }).toFormat("yyyy-MM-dd");
				break;
			case "1W":
				fromDate = now.minus({ weeks: 1 }).toFormat("yyyy-MM-dd");
				break;
			case "1M":
				fromDate = now.minus({ months: 1 }).toFormat("yyyy-MM-dd");
				break;
			case "ALL":
				fromDate = null;
				break;
			default:
				throw new Error(`Invalid HistoryOption: ${option}`);
		}

		console.log("Formatted fromDate (YYYY-MM-DD):", fromDate);

		console.log(deviceId);
		// Build the query
		let query = client.from("deviceLogs").select("*").eq("device_id", deviceId);

		if (fromDate) {
			// Use raw date string directly
			query = query.filter("created_at", "gte", fromDate);
		}

		query = query.order("created_at", { ascending: true }).limit(50);

		// Execute the query
		const { data, error } = await query;

		if (error) {
			console.error("Error fetching filtered logs:", error);
			throw error;
		}

		console.log("Fetched Data:", data);
		return data;
	},
};
