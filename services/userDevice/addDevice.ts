// services/userDevice/addDevice.ts

import NetInfo from "@react-native-community/netinfo";
import { getSupabaseClient } from "@/services/supabaseClient";
import { Platform } from "react-native";

// Define the return type for clarity and type safety
interface LinkDeviceResult {
	success: boolean;
	data?: any;
	error?: string | Error;
}

// Helper function to determine if an error is transient
const isTransientError = (error: any): boolean => {
	// Define transient errors based on error codes or messages
	const transientErrorMessages = [
		"timeout",
		"network",
		"temporarily unavailable",
		"service unavailable",
		"conflict",
		"failed to fetch",
		"ECONNRESET",
		"ETIMEDOUT",
		"EHOSTUNREACH",
		"ENOTFOUND",
		"ECONNREFUSED",
		"ESOCKETTIMEDOUT",
	];

	if (error && typeof error.message === "string") {
		return transientErrorMessages.some((msg) =>
			error.message.toLowerCase().includes(msg)
		);
	}
	return false;
};

// Exponential backoff delay function
const getExponentialBackoffDelay = (
	attempt: number,
	baseDelay: number = 1000, // 1 second
	maxDelay: number = 30000 // 30 seconds
): number => {
	const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
	const jitter = Math.random() * 1000; // Random jitter up to 1 second
	return delay + jitter;
};

export const linkDeviceToUser = async ({
	userId,
	deviceId,
	deviceType,
	deviceName,
}: {
	userId: string;
	deviceId: string;
	deviceType: string;
	deviceName: string;
}): Promise<LinkDeviceResult> => {
	console.log("Attempting to link device with the following details:");
	console.log({ userId, deviceId, deviceType, deviceName });

	// Validate input parameters
	if (!userId || !deviceId || !deviceType || !deviceName) {
		console.error("Invalid input parameters:", {
			userId,
			deviceId,
			deviceType,
			deviceName,
		});
		return { success: false, error: "Invalid input parameters." };
	}

	// Retry logic parameters
	let attempts = 0;
	const maxAttempts = 10;
	const baseRetryDelay = 5000; //number of seconds

	// Helper function to check internet connectivity
	const checkInternetConnection = async (): Promise<boolean> => {
		try {
			const state = await NetInfo.fetch();
			if (state.isConnected && state.isInternetReachable) {
				if (Platform.OS === "web") {
					// On web, skip additional connectivity checks to avoid CORS issues
					return true;
				} else {
					// On native platforms, `isInternetReachable` is sufficient
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error("Error checking internet connection:", error);
			return false;
		}
	};

	while (attempts < maxAttempts) {
		const isConnected = await checkInternetConnection();

		if (isConnected) {
			try {
				console.log(
					`Attempt ${attempts + 1}: Inserting record into Supabase...`
				);
				const client = getSupabaseClient();
				const { data, error } = await client
					.from("userdevices")
					.insert({
						user_id: userId,
						device_id: deviceId,
						device_type: deviceType,
						device_name: deviceName,
					})
					.single();

				if (error) {
					console.error("Error inserting userdevice record:", error);

					if (isTransientError(error)) {
						// Transient error encountered, decide to retry
						console.warn(
							`Transient error: ${error.message}. Will retry after delay.`
						);
						// Proceed to retry after delay
					} else {
						// Non-transient error, do not retry
						return { success: false, error: error.message || "Unknown error." };
					}
				} else {
					console.log("Successfully linked device to user:", data);
					return { success: true, data };
				}
			} catch (error: any) {
				console.error("Error during Supabase operation:", error);

				if (isTransientError(error)) {
					// Transient error, prepare to retry
					console.warn(
						`Transient error encountered: ${error.message}. Retrying after delay...`
					);
					// Proceed to retry after delay
				} else {
					// Non-transient error, do not retry
					return { success: false, error: error.message || "Unknown error." };
				}
			}
		} else {
			console.log("No internet connection detected.");
		}

		// If not connected or encountered a transient error, wait before retrying
		if (attempts < maxAttempts - 1) {
			const delay = getExponentialBackoffDelay(attempts, baseRetryDelay, 30000);
			console.warn(
				`Attempt ${attempts + 1} failed. Retrying in ${Math.round(delay / 1000)} seconds...`
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		attempts++;
	}

	// Fail after max attempts
	console.error("Failed to link device to user after multiple attempts.");
	return {
		success: false,
		error: "Failed to link device to user after multiple retries.",
	};
};
