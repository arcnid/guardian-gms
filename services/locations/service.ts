import { getSupabaseClient } from "@/services/supabaseClient";
import { UserDeviceService } from "@/services/userDevice/service";
import { binService } from "@/services/bins/service";
import { useRSXformBuffer } from "@shopify/react-native-skia";

export const locationService = {
	getLocationsForUser: async (userId: string) => {
		const client = getSupabaseClient();

		try {
			// Fetch locations for the user
			const { data: locations, error: locationError } = await client
				.from("locations")
				.select("*")
				.eq("user_id", userId);

			if (locationError)
				throw new Error(`Error fetching locations: ${locationError.message}`);
			if (!locations || locations.length === 0)
				throw new Error("No locations found");

			// Fetch bins and devices for each location
			const returnStructure = await Promise.all(
				locations.map(async (location) => {
					const bins = await binService.getBinsForLocation(location.id);

					if (!bins || bins.length === 0)
						throw new Error(`No bins found for location ${location.id}`);

					// Attach devices to each bin
					const binsWithDevices = await Promise.all(
						bins.map(async (bin) => {
							const devices = await UserDeviceService.getDevicesOnBin(bin.id);

							if (!devices || devices.length === 0)
								throw new Error(`No devices found for bin ${bin.id}`);

							// Attach device details (including latest log) to each device
							const devicesWithDetails = await Promise.all(
								devices.map(async (device) => {
									console.log("Getting device details for device:", device);
									const deviceDetails =
										await UserDeviceService.getDeviceWithLatestLog(
											device.device_id
										);

									return deviceDetails;
								})
							);

							return { ...bin, devices: devicesWithDetails };
						})
					);

					return { ...location, bins: binsWithDevices };
				})
			);

			console.log("returnStritoetr", returnStructure);

			return returnStructure;
		} catch (error) {
			console.error("Error building locations structure:", error);
			throw error; // Ensure errors propagate properly
		}
	},
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

			if (error) throw new Error(`Error fetching data: ${error.message}`);
			if (!locations || locations.length === 0)
				throw new Error("No locations found");

			return locations;
		} catch (error) {
			console.error("Error fetching data with joins:", error);
			throw error;
		}
	},
};
