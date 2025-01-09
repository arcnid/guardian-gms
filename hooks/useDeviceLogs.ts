// hooks/useDeviceLogs.ts

import { useState, useEffect, useCallback } from "react";
import { UserDeviceService } from "@/services/userDevice/service";

// Define LogEntry interface
interface LogEntry {
	id: number;
	created_at: string;
	temp_sensor_reading: number;
	humid_sensor_reading: number;
}

// Define DeviceLogsResponse interface
interface DeviceLogsResponse {
	fromDate: string | null;
	toDate: string;
	data: LogEntry[];
}

// Simple in-memory cache: key => DeviceLogsResponse
const logsCache: Record<string, DeviceLogsResponse> = {};

// Helper to map timeframe label to API option
function mapTimeframeToOption(label: string): string {
	switch (label) {
		case "1D":
			return "1D";
		case "1W":
			return "1W";
		case "1M":
			return "1M";
		case "1Y":
			return "1Y";
		case "MAX":
			return "MAX"; // Ensure "MAX" maps correctly
		default:
			return "1D";
	}
}

/**
 * useDeviceLogs - Custom hook for fetching (and caching) device logs
 * @param deviceId string
 * @param timeframe string (e.g. "1D", "1W", etc.)
 */
export function useDeviceLogs(deviceId: string, timeframe: string) {
	const [data, setData] = useState<LogEntry[] | null>(null);
	const [fromDate, setFromDate] = useState<string | null>(null);
	const [toDate, setToDate] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	console.log("toDate", toDate);

	// Combine deviceId and timeframe into a single cache key
	const cacheKey = `${deviceId}-${timeframe}`;

	// Memoize the fetch logic
	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// Check if data is already in cache
			if (logsCache[cacheKey]) {
				const cachedResponse = logsCache[cacheKey];
				setFromDate(cachedResponse.fromDate);
				setToDate(cachedResponse.toDate);
				setData(cachedResponse.data);
				setLoading(false);
				return;
			}

			// Map the timeframe to the appropriate option
			const option = mapTimeframeToOption(timeframe);

			// Fetch data using the service
			const response: DeviceLogsResponse =
				await UserDeviceService.getDeviceLogs({
					deviceId,
					option,
				});

			// Validate the response structure
			if (
				(response.fromDate !== null && typeof response.fromDate !== "string") ||
				typeof response.toDate !== "string" ||
				!Array.isArray(response.data)
			) {
				throw new Error("Invalid data format received from API.");
			}

			// Cache the response
			logsCache[cacheKey] = response;

			// Update state with fetched data
			setFromDate(response.fromDate);
			setToDate(response.toDate);
			setData(response.data);
		} catch (err) {
			console.error("Error fetching device logs:", err);
			setError("Failed to load data. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [cacheKey, deviceId, timeframe]);

	// Fetch data when deviceId or timeframe changes
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Return the fetched data and control states
	return { data, fromDate, toDate, loading, error, refetch: fetchData };
}
