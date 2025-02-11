import { getSupabaseClient } from "@/services/supabaseClient";
import { UserDeviceService } from "@/services/userDevice/service";

export const binService = {
	getBinsForLocation: async (locationId: string) => {
		// locationId = "7f76cd8f-ec85-4ad8-9dc6-65f8b1e6aa6";
		try {
			const supabase = getSupabaseClient();
			const { data, error } = await supabase
				.from("bins")
				.select("*")
				.eq("location_id", locationId);

			if (error) throw error;

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
	createBin: async (locationId: string, binName: string) => {
		const client = getSupabaseClient();
		try {
			console.log("trying to create bin");
			console.log({ locationId, binName });
			const { data, error } = await client
				.from("bins")
				.insert([{ location_id: locationId, name: binName }]);

			if (error) throw error;

			return data;
		} catch (e) {
			console.error(e);
		}
	},
	deleteBin: async (binId: string) => {
		const client = getSupabaseClient();
		try {
			const { data, error } = await client
				.from("bins")
				.delete()
				.eq("id", binId);

			if (error) throw error;

			return data;
		} catch (e) {
			console.error(e);
		}
	},
	getUserDevicesWithoutABin: async (userId: string) => {
		const client = getSupabaseClient();

		try {
			const devices = await client
				.from("userdevices")
				.select("*")
				.eq("user_id", userId)
				.is("bin_id", null);

			console.log("devices without a bin", devices);

			return devices.data;
		} catch (e) {
			console.error(e);
		}
	},
	removeDeviceFromBin: async (deviceId: string) => {
		const client = getSupabaseClient();
		try {
			const { data, error } = await client
				.from("userdevices")
				.update({ bin_id: null })
				.eq("id", deviceId);

			if (error) throw error;

			return data;
		} catch (e) {
			console.error(e);
		}
	},
	addDeviceToBin: async (deviceId: string, binId: string) => {
		const client = getSupabaseClient();
		try {
			const { data, error } = await client
				.from("userdevices")
				.update({ bin_id: binId })
				.eq("id", deviceId);

			if (error) throw error;

			return data;
		} catch (e) {
			console.error(e);
		}
	},
};
