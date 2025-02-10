import { getSupabaseClient } from "@/services/supabaseClient";
import { UserDeviceService } from "@/services/userDevice/service";
import { binService } from "@/services/bins/service";
import { v4 as uuidv4 } from "uuid";

interface CreateLocationParams {
	userId: string;
	locationName: string;
	latitude: number;
	longitude: number;
}
export const locationService = {
	getLocationsForUser: async (userId: string) => {
		const client = getSupabaseClient();

		try {
			// 1) Fetch locations for the user
			const { data: locations, error: locationError } = await client
				.from("locations")
				.select("*")
				.eq("user_id", userId);

			if (locationError) {
				throw new Error(`Error fetching locations: ${locationError.message}`);
			}

			// If no locations, just return an empty array
			if (!locations || locations.length === 0) {
				return [];
			}

			// 2) For each location, fetch bins & devices
			const returnStructure = await Promise.all(
				locations.map(async (location) => {
					// Fetch bins for the current location (or default to empty array)
					let bins = await binService.getBinsForLocation(location.id);
					if (!bins) {
						bins = [];
					}

					// Attach devices to each bin
					const binsWithDevices = await Promise.all(
						bins.map(async (bin) => {
							// Fetch devices for the bin (or default to empty array)
							let devices = await UserDeviceService.getDevicesOnBin(bin.id);
							if (!devices) {
								devices = [];
							}

							// Attach device details (including latest log)
							const devicesWithDetails = await Promise.all(
								devices.map(async (device) => {
									const deviceDetails =
										await UserDeviceService.getDeviceWithLatestLog(
											device.device_id
										);
									// If for some reason we don't get deviceDetails, fall back to the raw device
									return deviceDetails || device;
								})
							);

							return { ...bin, devices: devicesWithDetails };
						})
					);

					// Return a complete location object with bins/devices
					return { ...location, bins: binsWithDevices };
				})
			);

			return returnStructure;
		} catch (error) {
			console.error("Error building locations structure:", error);
			throw error; // Propagate the error up if something truly fails
		}
	},

	// (You can keep your existing getLocationsFromQuery method or modify it similarly)
	getLocationsFromQuery: async (userId: string) => {
		const client = getSupabaseClient();
		try {
			// Fetch all data in a single query with joins and aggregation
			const { data: locations, error } = await client
				.from("locations")
				.select(
					`
            *,
            bins (
              *,
              userdevices (
                *,
                latest_log:deviceLogs (*)
              )
            )
          `
				)
				.eq("user_id", userId);

			if (error) {
				throw new Error(`Error fetching data: ${error.message}`);
			}
			if (!locations || locations.length === 0) {
				return [];
			}

			return locations;
		} catch (error) {
			console.error("Error fetching data with joins:", error);
			throw error;
		}
	},
	createLocation: async ({
		latitude,
		longitude,
		locationName,
		userId,
	}: CreateLocationParams) => {
		const client = getSupabaseClient();
		try {
			const { data, error } = await client.from("locations").insert([
				{
					id: uuidv4(),
					user_id: userId,
					name: locationName,
					latitude,
					longitude,
				},
			]);

			if (error) {
				throw new Error(`Error creating location: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("Error creating location:", error);
			throw error;
		}
	},
};
