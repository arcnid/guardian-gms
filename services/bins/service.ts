import { getSupabaseClient } from "@/services/supabaseClient";
import { UserDeviceService } from "@/services/userDevice/service";

export const binService = {
	getBinsForLocation: async (locationId: string) => {
		console.log("getting bins for location", locationId);

		// locationId = "7f76cd8f-ec85-4ad8-9dc6-65f8b1e6aa6";
		try {
			const supabase = getSupabaseClient();
			const { data, error } = await supabase
				.from("bins")
				.select("*")
				.eq("location_id", locationId);

			if (error) throw error;

			const additional = await binService.getDevicesOnBin(data[0].id);

			return data;
		} catch (e) {
			console.error(e);
		}
	},

	getDevicesOnBin: async (binId: string) => {
		const client = getSupabaseClient();

		try {
			const devices = await client
				.from("userDevices")
				.select("*")
				.eq("bin_id", binId);

			return devices;
		} catch (e) {
			console.error(e);
		}
	},
};
