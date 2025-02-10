// components/devices/RecentSensorData.tsx
import React, { useEffect, useState, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	AppState,
	AppStateStatus,
} from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { getSupabaseClient } from "@/services/supabaseClient";
import {
	SupabaseClient,
	PostgresChangesPayload,
	RealtimeChannel,
} from "@supabase/supabase-js";

/**
 * Metric Service to convert temperatures between Celsius and Fahrenheit.
 */
const metricService = {
	/**
	 * Converts Celsius to Fahrenheit.
	 *
	 * @param celsius - The temperature in Celsius.
	 * @returns The converted temperature in Fahrenheit.
	 */
	getCtoF: (celsius: number): number => {
		return (celsius * 9) / 5 + 32;
	},

	/**
	 * Converts Fahrenheit to Celsius.
	 *
	 * @param fahrenheit - The temperature in Fahrenheit.
	 * @returns The converted temperature in Celsius.
	 */
	getFtoC: (fahrenheit: number): number => {
		return ((fahrenheit - 32) * 5) / 9;
	},
};

/**
 * Helper function to calculate time difference and return a "time ago" string
 */
const timeAgo = (timestamp: string): string => {
	if (!timestamp) return "N/A";
	const now = new Date();
	const then = new Date(timestamp);
	const secondsPast = Math.floor((now.getTime() - then.getTime()) / 1000);

	if (isNaN(secondsPast) || secondsPast < 0) {
		return "N/A";
	}

	if (secondsPast < 60) {
		return `${secondsPast} sec${secondsPast !== 1 ? "s" : ""} ago`;
	}
	if (secondsPast < 3600) {
		const minutes = Math.floor(secondsPast / 60);
		return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
	}
	if (secondsPast < 86400) {
		const hours = Math.floor(secondsPast / 3600);
		return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
	}
	const days = Math.floor(secondsPast / 86400);
	return `${days} day${days !== 1 ? "s" : ""} ago`;
};

/**
 * LogEntry Interface
 */
interface LogEntry {
	id: number;
	created_at: string;
	temp_sensor_reading: number;
	humid_sensor_reading: number;
	// Add other relevant fields if necessary
}

/**
 * Props Interface for RecentSensorData
 */
interface RecentSensorDataProps {
	deviceId: string;
	refreshCounter: number; // New prop
}

/**
 * RecentSensorData Component to display temperature, humidity, and last communication time.
 * Now also displays the temperature in Fahrenheit.
 */
export const RecentSensorData: React.FC<RecentSensorDataProps> = ({
	deviceId,
	refreshCounter,
}) => {
	const [latestLog, setLatestLog] = useState<LogEntry | null>(null);
	const [timeAgoString, setTimeAgoString] = useState<string>("N/A");
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// IMPORTANT: Use a numeric or “ReturnType<typeof setInterval>” ref instead of NodeJS.Timeout
	const intervalRef = useRef<number | null>(null);

	// Keep a reference to the Realtime subscription, if needed
	const subscriptionRef = useRef<RealtimeChannel | null>(null);

	// Track app state
	const appState = useRef<AppStateStatus>(AppState.currentState);

	// Supabase client
	const supabaseClient: SupabaseClient = getSupabaseClient();

	/**
	 * Fetch the latest log entry for the device
	 */
	const fetchLatestLog = async () => {
		console.log("Fetching latest log for deviceId:", deviceId);
		try {
			const { data, error: supabaseError } = await supabaseClient
				.from<LogEntry>("deviceLogs") // Ensure table name is correct
				.select("*")
				.eq("device_id", deviceId)
				.order("created_at", { ascending: false })
				.limit(1);

			console.log("Fetch response data:", data);

			if (supabaseError) {
				console.error("Error fetching latest log:", supabaseError);
				setError("Failed to fetch latest log.");
				return;
			}

			if (data && data.length > 0) {
				setLatestLog(data[0]);
				setTimeAgoString(timeAgo(data[0].created_at));
			} else {
				console.log("No logs found for deviceId:", deviceId);
				setLatestLog(null);
				setTimeAgoString("N/A");
			}
		} catch (err) {
			console.error("Unexpected error fetching latest log:", err);
			setError("An unexpected error occurred.");
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Subscribe to real-time log insertions for the device
	 */
	const subscribeToNewLogs = () => {
		// Create a unique channel name based on deviceId and refreshCounter
		const channelName = `device-logs-${deviceId}-${refreshCounter}`;
		console.log("Subscribing to channel:", channelName);

		const subscription = supabaseClient
			.channel(channelName)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public", // Or your actual schema
					table: "deviceLogs",
					filter: `device_id=eq.${deviceId}`, // Properly formatted filter
				},
				(payload: PostgresChangesPayload<LogEntry>) => {
					console.log("Realtime log insert received:", payload.new);
					setLatestLog(payload.new);
					setTimeAgoString(timeAgo(payload.new.created_at));
				}
			)
			.subscribe((status) => {
				console.log(`Subscription status for ${channelName}:`, status);
				if (status === "SUBSCRIBED") {
					console.log("Connected to Supabase Realtime!");
				}
				if (status === "CHANNEL_ERROR") {
					console.log("There was an error subscribing to the channel.");
				}
				if (status === "TIMED_OUT") {
					console.log("Realtime server did not respond in time.");
				}
				if (status === "CLOSED") {
					console.log("Realtime channel was unexpectedly closed.");
				}
			});

		subscriptionRef.current = subscription;
	};

	/**
	 * Cleanup Supabase subscription and timer
	 */
	const cleanupResources = () => {
		// Unsubscribe if subscription exists
		if (subscriptionRef.current) {
			supabaseClient.removeChannel(subscriptionRef.current);
			console.log("Unsubscribed from channel:", subscriptionRef.current);
			subscriptionRef.current = null;
		}

		// Clear interval if it exists
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current);
			console.log("Cleared interval");
			intervalRef.current = null;
		}
	};

	/**
	 * Initialize data fetching and subscriptions
	 */
	useEffect(() => {
		console.log(
			"Initializing RecentSensorData for deviceId:",
			deviceId,
			"refreshCounter:",
			refreshCounter
		);
		fetchLatestLog();
		subscribeToNewLogs();

		// Handler for app state changes
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			// If the app comes from background to foreground, refresh data
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === "active"
			) {
				console.log("App has come to the foreground!");
				fetchLatestLog();
			}
			appState.current = nextAppState;
		};

		// Listen to app state changes
		const appStateSubscription = AppState.addEventListener(
			"change",
			handleAppStateChange
		);

		// Cleanup on unmount or when dependencies change
		return () => {
			cleanupResources();
			// Remove app state listener
			appStateSubscription.remove();
		};
	}, [deviceId, refreshCounter]);

	/**
	 * Update "Last Reading" every second
	 */
	useEffect(() => {
		const updateTimeAgo = () => {
			if (latestLog) {
				setTimeAgoString(timeAgo(latestLog.created_at));
			} else {
				setTimeAgoString("N/A");
			}
		};

		// Initial update
		updateTimeAgo();

		// Set interval to update every second
		const id = setInterval(updateTimeAgo, 1000);
		intervalRef.current = id as unknown as number; // or just (id as number)

		console.log("Interval set for updating timeAgoString");

		// Cleanup interval on unmount or when latestLog changes
		return () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				console.log("Cleared interval");
				intervalRef.current = null;
			}
		};
	}, [latestLog]);

	/**
	 * Render Loading State
	 */
	if (loading) {
		return (
			<View style={styles.sensorData}>
				<Text style={styles.sectionHeader}>Recent Sensor Data</Text>
				<ActivityIndicator size="small" color="#71A12F" />
			</View>
		);
	}

	/**
	 * Render Error State
	 */
	if (error) {
		return (
			<View style={styles.sensorData}>
				<Text style={styles.sectionHeader}>Recent Sensor Data</Text>
				<Text style={styles.errorText}>{error}</Text>
			</View>
		);
	}

	/**
	 * Render Sensor Data
	 */
	return (
		<View style={styles.sensorData}>
			<Text style={styles.sectionHeader}>Recent Sensor Data</Text>

			<View style={styles.sensorRow}>
				<MaterialIcons name="thermostat" size={30} color="#FF5722" />
				<View style={styles.labelValueContainer}>
					<Text style={styles.label}>Temperature</Text>
					<Text style={styles.value}>
						{latestLog && latestLog.temp_sensor_reading !== null
							? // Display both Celsius and Fahrenheit (rounded to 1 decimal place)
								`${latestLog.temp_sensor_reading}°C (${metricService
									.getCtoF(latestLog.temp_sensor_reading)
									.toFixed(1)}°F)`
							: "N/A"}
					</Text>
				</View>
			</View>

			<View style={styles.sensorRow}>
				<MaterialIcons name="water-drop" size={30} color="#2196F3" />
				<View style={styles.labelValueContainer}>
					<Text style={styles.label}>Humidity</Text>
					<Text style={styles.value}>
						{latestLog && latestLog.humid_sensor_reading !== null
							? `${latestLog.humid_sensor_reading}%`
							: "N/A"}
					</Text>
				</View>
			</View>

			<View style={styles.sensorRow}>
				<MaterialIcons name="access-time" size={30} color="#555555" />
				<View style={styles.labelValueContainer}>
					<Text style={styles.label}>Last Reading</Text>
					<Text style={styles.value}>{timeAgoString}</Text>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	sensorData: {
		backgroundColor: "#FFF",
		padding: 16,
		borderRadius: 10,
		elevation: 3,
		marginBottom: 15,
		marginTop: 5,
		paddingBottom: 10,
	},
	sensorRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
	},
	labelValueContainer: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginLeft: 10,
	},
	label: {
		fontSize: 16,
		color: "#333",
		flex: 1,
	},
	value: {
		fontSize: 16,
		color: "#333",
		textAlign: "right",
		flex: 1,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
	},
	errorText: {
		fontSize: 16,
		color: "red",
		textAlign: "center",
	},
});
