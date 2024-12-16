import { getSupabaseClient } from "@/services/supabaseClient";

export const linkDeviceToUser = async ({
	userId,
	deviceId,
}: {
	userId: string;
	deviceId: string;
}) => {
	// connect to supabase
	const client = getSupabaseClient();

	// Insert a new record into the 'userdevices' table.
	// We just need to provide the user_id and device_id fields.
	// Other fields (like device_name or status) can be null or have defaults.
	const { data, error } = await client
		.from("userdevices")
		.insert({
			user_id: userId,
			device_id: deviceId,
		})
		.single();

	if (error) {
		console.error("Error inserting userdevice record:", error);
		return { success: false, error };
	}

	console.log("Successfully linked device to user:", data);
	return { success: true, data };
};
