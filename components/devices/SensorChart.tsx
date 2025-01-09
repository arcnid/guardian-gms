// components/SensorChart.tsx

import React, { useState, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {} from "victory-native";
import { useFonts } from "expo-font";
import { DateTime } from "luxon";

import { LogEntry } from "@/types"; // Or define in this file
import { useDeviceLogs } from "@/hooks/useDeviceLogs"; // Our custom hook

interface SensorChartProps {
	deviceId: string;
}

export const SensorChart: React.FC<SensorChartProps> = ({ deviceId }) => {
	// Load custom font
	const [fontsLoaded] = useFonts({
		GeistMedium: require("@/fonts/Geist-Medium.ttf"),
	});

	// State for selected metric & timeframe
	const [selectedMetric, setSelectedMetric] = useState<
		"Temperature" | "Humidity"
	>("Temperature");
	const [timeframe, setTimeframe] = useState<string>("1D");

	// Fetch logs (cached) via our custom hook
	const {
		data: logs,
		fromDate,
		toDate,
		loading,
		error,
		refetch,
	} = useDeviceLogs(deviceId, timeframe);

	// Convert fromDate and toDate to DateTime objects
	const fromDateTime = fromDate ? DateTime.fromISO(fromDate) : null;
	const toDateTime = toDate ? DateTime.fromISO(toDate) : DateTime.utc();

	// Helper function to format labels based on timeframe
	const formatLabel = (date: Date) => {
		const dt = DateTime.fromJSDate(date);
		switch (timeframe) {
			case "1D":
				// For 1 Day, show labels at specific hours (e.g., every 4 hours)
				return dt.toFormat("HH:mm");
			case "1W":
				// For 1 Week, show day names (e.g., Mon, Wed, Fri, Sun)
				return dt.toFormat("ccc"); // 'ccc' for abbreviated weekday
			case "1M":
				// For 1 Month, show dates (e.g., 11/01, 11/15, 11/30)
				return dt.toFormat("MM/dd");
			case "1Y":
				// For 1 Year, show month names (e.g., Jan, Mar, May)
				return dt.toFormat("LLL"); // 'LLL' for abbreviated month
			case "MAX":
				// For MAX, show years (e.g., 2020, 2021, ...)
				return dt.toFormat("yyyy");
			default:
				return "";
		}
	};

	// Helper function to check and insert a dummy data point at the start if necessary
	const processLogs = (sortedLogs: LogEntry[]) => {
		const completeLogs = [...sortedLogs];

		if (fromDateTime) {
			const startOfWindow = fromDateTime.toUTC();
			const firstLogDateTime =
				sortedLogs.length > 0
					? DateTime.fromISO(sortedLogs[0].created_at).toUTC()
					: null;

			// Check if the first log is at the start of the window
			if (!firstLogDateTime || firstLogDateTime > startOfWindow) {
				// Insert dummy data point at the start
				const dummyLog: LogEntry = {
					id: -1, // Negative ID to indicate dummy
					created_at: startOfWindow.toISO(),
					temp_sensor_reading: 0,
					humid_sensor_reading: 0,
				};
				completeLogs.unshift(dummyLog);
			}
		}

		return completeLogs;
	};

	// Prepare data for chart
	const chartData = useMemo(() => {
		if (!logs || logs.length === 0) {
			// If no logs, display a single dummy data point at the start of the window
			if (!fromDateTime || !toDateTime) {
				return {
					labels: [],
					datasets: [
						{
							data: [],
							color: (opacity = 1) =>
								selectedMetric === "Temperature"
									? `rgba(255, 87, 34, ${opacity})`
									: `rgba(33, 150, 243, ${opacity})`,
							strokeWidth: 3,
						},
					],
					legend: [
						selectedMetric === "Temperature"
							? "Temperature (°C)"
							: "Humidity (%)",
					],
				};
			}

			return {
				labels: [formatLabel(toDateTime.toJSDate())],
				datasets: [
					{
						data: [0], // Dummy data point
						color: (opacity = 1) =>
							selectedMetric === "Temperature"
								? `rgba(255, 87, 34, ${opacity})`
								: `rgba(33, 150, 243, ${opacity})`,
						strokeWidth: 3,
					},
				],
				legend: [
					selectedMetric === "Temperature"
						? "Temperature (°C)"
						: "Humidity (%)",
				],
			};
		}

		// Sort logs by date ascending
		const sortedLogs = [...logs].sort(
			(a, b) =>
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		);

		// Insert dummy data point at the start if necessary
		const completeLogs = processLogs(sortedLogs);

		const labels: string[] = [];
		const dataPoints: number[] = [];

		completeLogs.forEach((log) => {
			const date = new Date(log.created_at);
			let label = "";

			if (log.id === -1) {
				// Dummy data point
				label = formatLabel(date);
			} else {
				// Real data point
				label = formatLabel(date);
			}

			labels.push(label);

			const reading =
				selectedMetric === "Temperature"
					? Number(log.temp_sensor_reading)
					: Number(log.humid_sensor_reading);

			dataPoints.push(isNaN(reading) ? 0 : reading);
		});

		return {
			labels,
			datasets: [
				{
					data: dataPoints,
					color: (opacity = 1) =>
						selectedMetric === "Temperature"
							? `rgba(255, 87, 34, ${opacity})`
							: `rgba(33, 150, 243, ${opacity})`,
					strokeWidth: 3,
				},
			],
			legend: [
				selectedMetric === "Temperature" ? "Temperature (°C)" : "Humidity (%)",
			],
		};
	}, [logs, selectedMetric, timeframe, fromDate, toDate]);

	return (
		<View style={styles.container}>
			{/* Inline error (don’t hide the chart) */}
			{error && (
				<View style={styles.errorInline}>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={() => refetch()} // triggers fetch again
						accessibilityLabel="Retry fetching logs"
					>
						<Text style={styles.retryButtonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Metric Toggle */}
			<View style={styles.toggleContainer}>
				<TouchableOpacity
					style={[
						styles.toggleButton,
						selectedMetric === "Temperature" && styles.toggleButtonActive,
					]}
					onPress={() => setSelectedMetric("Temperature")}
					accessibilityLabel="Toggle to Temperature metric"
				>
					<Text
						style={[
							styles.toggleButtonText,
							selectedMetric === "Temperature" && styles.toggleButtonTextActive,
						]}
					>
						Temperature
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.toggleButton,
						selectedMetric === "Humidity" && styles.toggleButtonActive,
					]}
					onPress={() => setSelectedMetric("Humidity")}
					accessibilityLabel="Toggle to Humidity metric"
				>
					<Text
						style={[
							styles.toggleButtonText,
							selectedMetric === "Humidity" && styles.toggleButtonTextActive,
						]}
					>
						Humidity
					</Text>
				</TouchableOpacity>
			</View>

			<Text style={styles.title}>
				{selectedMetric === "Temperature"
					? "Temperature Over Time (°C)"
					: "Humidity Over Time (%)"}
			</Text>

			{/* Chart always rendered (shows empty if no data) */}
			<View style={styles.chartWrapper}>
				<LineChart
					data={chartData}
					/*
                        We set the chart width to
                        (windowWidth - 32), matching the container's horizontal paddings.
                        This ensures the chart fits snugly inside the container width.
                    */
					width={Dimensions.get("window").width - 32}
					height={300}
					yAxisSuffix={selectedMetric === "Temperature" ? "°C" : "%"}
					yAxisInterval={1}
					withDots={false}
					withShadow={false}
					withVerticalLines={false}
					withHorizontalLines={true}
					chartConfig={{
						backgroundColor: "#FFFFFF",
						backgroundGradientFrom: "#FFFFFF",
						backgroundGradientTo: "#FFFFFF",
						decimalPlaces: 1,
						color: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
						labelColor: (opacity = 1) => `rgba(97, 97, 97, ${opacity})`,
						style: {
							borderRadius: 16,
						},
						propsForDots: {
							r: "4",
							strokeWidth: "2",
							stroke: "#4CAF50",
						},
						propsForLabels: {
							fontFamily: fontsLoaded ? "GeistMedium" : "System",
							fontSize: 10, // Reduced font size for better fit
						},
						// If label rotation is supported, you can uncomment the next line
						// labelRotation: -45,
					}}
					bezier
					style={styles.chart}
				/>
			</View>

			{/* Timeframe Buttons */}
			<View style={styles.buttonContainer}>
				{["1D", "1W", "1M", "1Y", "MAX"].map((label) => (
					<TouchableOpacity
						key={label}
						style={[
							styles.button,
							timeframe === label ? styles.buttonActive : null,
						]}
						onPress={() => setTimeframe(label)}
						disabled={loading}
						accessibilityLabel={`Select ${label} timeframe`}
					>
						<Text
							style={[
								styles.buttonText,
								timeframe === label ? styles.buttonTextActive : null,
							]}
						>
							{label}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Loading Indicator */}
			{(!fontsLoaded || loading) && (
				<Text style={styles.fontLoadingText}>
					{fontsLoaded ? "Loading data..." : "Fonts still loading..."}
				</Text>
			)}
		</View>
	);
};

// Styles only, no logic changes
const styles = StyleSheet.create({
	container: {
		marginTop: 20,
		padding: 16,
		backgroundColor: "#FFF",
		borderRadius: 10,
		elevation: 3,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		fontFamily: "GeistMedium",
		textAlign: "center",
		marginBottom: 10,
		color: "#333",
	},
	toggleContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: 16,
	},
	toggleButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: "#F0F0F0",
		flex: 1,
		marginHorizontal: 4,
		alignItems: "center",
	},
	toggleButtonActive: {
		backgroundColor: "#4CAF50",
	},
	toggleButtonText: {
		fontFamily: "GeistMedium",
		fontSize: 14,
		color: "#333",
	},
	toggleButtonTextActive: {
		color: "#FFF",
	},
	chartWrapper: {
		marginVertical: 8,
		borderRadius: 16,
		overflow: "hidden",
		paddingRight: 20,
		paddingLeft: 20,
	},
	chart: {
		borderRadius: 16,
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 20,
	},
	button: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: "#F0F0F0",
		flex: 1,
		marginHorizontal: 4,
		alignItems: "center",
	},
	buttonActive: {
		backgroundColor: "#4CAF50",
	},
	buttonText: {
		fontFamily: "GeistMedium",
		fontSize: 14,
		color: "#333",
	},
	buttonTextActive: {
		color: "#FFF",
	},
	errorInline: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
		marginBottom: 10,
	},
	errorText: {
		color: "#D32F2F",
		fontSize: 14,
		fontFamily: "GeistMedium",
		marginRight: 10,
	},
	retryButton: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		backgroundColor: "#4CAF50",
		borderRadius: 8,
	},
	retryButtonText: {
		color: "#FFF",
		fontSize: 14,
		fontFamily: "GeistMedium",
	},
	fontLoadingText: {
		marginTop: 8,
		color: "#999",
		fontSize: 12,
		fontFamily: "GeistMedium",
		textAlign: "center",
	},
});
