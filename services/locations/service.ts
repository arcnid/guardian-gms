import { getSupabaseClient } from "@/services/supabaseClient";
import { UserDeviceService } from "@/services/userDevice/service";
import { binService } from "@/services/bins/service";
import { useRSXformBuffer } from "@shopify/react-native-skia";

export const locationService = {
	getLocationsForUser: async (userId: string) => {
		const client = getSupabaseClient();

		console.log("you have awoken");

		try {
			// Fetch locations for the user
			const { data: locations, error: locationError } = await client
				.from("locations")
				.select("*")
				.eq("user_id", userId);

			console.log("you see a location", locations);

			if (locationError)
				throw new Error(`Error fetching locations: ${locationError.message}`);
			if (!locations || locations.length === 0)
				throw new Error("No locations found");

			console.log("you start looking around");

			// Fetch bins and devices for each location
			const returnStructure = await Promise.all(
				locations.map(async (location) => {
					const bins = await binService.getBinsForLocation(location.id);

					if (!bins || bins.length === 0)
						throw new Error(`No bins found for location ${location.id}`);

					console.log("you see a bin", bins);

					// Attach devices to each bin
					const binsWithDevices = await Promise.all(
						bins.map(async (bin) => {
							const devices = await UserDeviceService.getDevicesOnBin(bin.id);

							if (!devices || devices.length === 0)
								throw new Error(`No devices found for bin ${bin.id}`);

							console.log("you see a device", devices);

							// Attach device details (including latest log) to each device
							const devicesWithDetails = await Promise.all(
								devices.map(async (device) => {
									console.log(
										"getting device details for readings and such and all that ",
										device
									);
									const deviceDetails =
										await UserDeviceService.getDeviceWithLatestLog(
											device.device_id
										);

									console.log("deviceDetails", deviceDetails);
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

		console.log("Fetching locations, bins, and devices for user:", userId);

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

			console.log("Fetched locations with nested bins and devices:", locations);

			return locations;
		} catch (error) {
			console.error("Error fetching data with joins:", error);
			throw error;
		}
	},
};
