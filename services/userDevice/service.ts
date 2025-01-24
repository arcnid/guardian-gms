import { getSupabaseClient } from "@/services/supabaseClient";
import { DateTime } from "luxon";
import { linkDeviceToUser } from "./addDevice";
import { largestTriangleThreeBuckets } from "@/utils/largestTriangleThreeBuckets";
import { transformOrigin } from "@shopify/react-native-skia";

type HistoryOption = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "MAX";
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

		// Current time in UTC
		const now = DateTime.utc();
		let fromDate: string | null = null;
		let toDate: string = now.toISO(); // Current time as ISO string

		switch (option) {
			case "1D":
				fromDate = now.minus({ days: 1 }).toISO(); // Start of today
				break;
			case "1W":
				fromDate = now.startOf("week").toISO(); // Start of the current week
				break;
			case "1M":
				fromDate = now.startOf("month").toISO(); // Start of the current month
				break;
			case "1Y":
				fromDate = now.startOf("year").toISO(); // Start of the current year
				break;
			case "MAX":
				fromDate = null; // No lower bound
				break;
			default:
				throw new Error(`Invalid HistoryOption: ${option}`);
		}

		console.log("Formatted fromDate (ISO):", fromDate);
		console.log("toDate (ISO):", toDate);
		console.log("deviceId:", deviceId);

		// Build the query
		let query = client.from("deviceLogs").select("*").eq("device_id", deviceId);

		if (fromDate) {
			query = query.gte("created_at", fromDate).lte("created_at", toDate);
		} else {
			query = query.lte("created_at", toDate);
		}

		query = query.order("created_at", { ascending: true });

		// Execute the query
		const { data, error } = await query;

		if (error) {
			console.error("Error fetching filtered logs:", error);
			throw error;
		}

		// Reduce the data for performance (adjust the bucket size as needed)
		const reducedSet = largestTriangleThreeBuckets(data, 10); // Adjust bucket size as needed

		// Return fromDate, toDate, and reduced data
		return {
			fromDate,
			toDate,
			data: reducedSet,
		};
	},

	getLatestTemp: async (deviceId: string) => {
		const client = getSupabaseClient();
		console.log("fetching latest temp");

		const { data, error } = await client
			.from("deviceLogs")
			.select("*")
			.eq("device_id", deviceId)
			.order("created_at", { ascending: false })
			.limit(1);

		if (error) {
			console.error("Error fetching latest temperature:", error);
			throw error;
		}

		return data;
	},

	updateDeviceImage: async (deviceId: string, imageData: Blob) => {
		const client = getSupabaseClient();
		try {
			// Step 1: Upload the image to the `images` bucket
			const fileName = `device_${deviceId}.jpg`;

			const { data: uploadData, error: uploadError } = await client.storage
				.from("Images") // Your bucket name
				.upload(fileName, imageData, {
					cacheControl: "3600",
					upsert: true,
				});

			console.log("upload Data", uploadData);

			if (uploadError) {
				console.error("Error uploading image:", uploadError.message);
				throw new Error("Image upload failed");
			}

			// Get the public URL of the uploaded image
			const { data: publicUrlData, error: publicUrlError } = client.storage
				.from("Images")
				.getPublicUrl(fileName);

			console.log("publicURl", publicUrlData.publicUrl);

			if (publicUrlError) {
				console.error("Error getting public URL:", publicUrlError.message);
				throw new Error("Failed to get public URL for the image");
			}

			const imageUrl = publicUrlData.publicUrl;

			// Step 2: Check if the device profile exists
			const { data: profileData, error: profileError } = await client
				.from("deviceprofiles")
				.select("*")
				.eq("device_id", deviceId)
				.single();

			if (profileError && profileError.code !== "PGRST116") {
				// Code "PGRST116" means no rows found; handle other errors
				console.error("Error checking device profile:", profileError.message);
				throw new Error("Error checking device profile");
			}

			console.log("no rows found");

			// Step 3: Update or Insert the device profile record
			if (profileData) {
				// Profile exists, update the `image_url` field
				const { error: updateError } = await client
					.from("deviceprofiles")
					.update({ image_url: imageUrl })
					.eq("device_id", deviceId);

				if (updateError) {
					console.error("Error updating device profile:", updateError.message);
					throw new Error("Error updating device profile");
				}
			} else {
				console.log(deviceId);
				// Profile doesn't exist, create a new record
				const { error: insertError } = await client
					.from("deviceprofiles")
					.insert({
						device_id: deviceId,
						image_url: imageUrl,
					});

				if (insertError) {
					console.error(
						"Error inserting new device profile:",
						insertError.message
					);
					throw new Error("Error inserting new device profile");
				}
			}

			return imageUrl; // Return the uploaded image URL
		} catch (err) {
			console.error("Error in updateDeviceImage:", err);
			throw err;
		}
	},

	getDeviceImageUrl: async (deviceId: string) => {
		const client = getSupabaseClient();
		console.log("getting image");

		const fileName = `device_${deviceId}.jpg`;
		try {
			const response = await client.storage
				.from("Images")
				.getPublicUrl(fileName);

			const url = response.data.publicUrl;

			return url;
		} catch (e) {
			console.error(e);
		}
	},

	getDevicesWithImage: async (deviceList: Array<string>) => {
		//list of deviceIDs
		const client = getSupabaseClient();

		//go through each record

		//look to see if there is a record inside of 'deviceprofiles' and if it has a image_url set, if it does, grab it and add it to the return list

		console.log("gonna look for profile record for ", deviceList);

		try {
			// Step 1: Fetch device profiles to check for image_url
			const { data: profiles, error: profileError } = await client
				.from("deviceprofiles")
				.select("*")
				.in("device_id", [...deviceList]);

			if (profileError) {
				console.log("not found");
				console.error("Error fetching device profiles:", profileError);
				throw profileError;
			}

			// Step 2: Create a map of device_id to image_url
			const deviceImageMap = new Map<string, string>();
			profiles?.forEach((profile) => {
				if (profile.image_url) {
					deviceImageMap.set(profile.device_id, profile.image_url);
				}
			});

			// Step 3: Fetch devices data
			const { data: devices, error } = await client
				.from("deviceprofiles")
				.select("*")
				.in("device_id", deviceList);

			if (error) {
				console.log("res", error);
				console.error("Error fetching devices:", error);
			}

			// Step 4: Enrich devices with image URLs
			const devicesWithImages = await Promise.all(
				devices?.map(async (device) => {
					if (deviceImageMap.has(device.device_id)) {
						const imageUrl = await UserDeviceService.getDeviceImageUrl(
							device.device_id
						);
						return { ...device, image: imageUrl };
					}
					// If no image exists, set image to empty string or a placeholder URL
					return { ...device, image: "" };
				}) || []
			);

			return devicesWithImages;
		} catch (error) {
			console.error("Error in getDevicesWithImage:", error);
			return [];
		}
		//
	},
	getDeviceWithLatestLog: async (deviceId: string) => {
		const client = getSupabaseClient();
		try {
			const device = await UserDeviceService.getDevice(deviceId);

			const latestLog = await UserDeviceService.getLatestTemp(deviceId);

			console.log("getting latest log on deviece", latestLog);

			//transform structure to get latest log into device object

			const transformedObject = {
				id: device.device_id,
				name: device.device_name,
				type: device.device_type,
				humidity: latestLog[0].humid_sensor_reading,
				temperature: latestLog[0].temp_sensor_reading,
				lastRead: latestLog[0].created_at,
				isOnline: device.status === "Online",
			};

			return transformedObject;
		} catch (e) {
			console.error(e);
		}
	},

	getDevicesOnBin: async (binId: string) => {
		const client = getSupabaseClient();

		try {
			const { data, error } = await client
				.from("userdevices")
				.select("*")
				.eq("bin_id", binId);

			if (error) {
				console.error("Error fetching devices on bin:", error);
				throw error;
			}

			return data;
		} catch (e) {
			console.error(e);
		}
	},
};
