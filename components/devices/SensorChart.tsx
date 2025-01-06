// components/SensorChart.tsx

import React, { useState, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useFonts } from "expo-font";
import { UserDeviceService } from "@/services/userDevice/service"; // Ensure correct path

// Define the log entry interface
interface LogEntry {
	id: number;
	created_at: string;
	temp_sensor_reading: number;
	humid_sensor_reading: number;
	// Other fields are omitted as they're not used in the chart
}

// Define the props for SensorChart
interface SensorChartProps {
	logs: LogEntry[];
	deviceId: string;
}

export const SensorChart: React.FC<SensorChartProps> = ({
	logs: initialLogs,
	deviceId,
}) => {
	// Load custom font
	const [fontsLoaded] = useFonts({
		GeistMedium: require("@/fonts/Geist-Medium.ttf"),
	});

	// State for logs, selected metric, timeframe, loading, and error
	const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
	const [selectedMetric, setSelectedMetric] = useState<
		"Temperature" | "Humidity"
	>("Temperature");
	const [timeframe, setTimeframe] = useState<string>("1D");
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Function to map SensorChart timeframe to API option
	const mapTimeframeToOption = (label: string): string => {
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
				return "ALL"; // Map "MAX" to "ALL"
			default:
				return "1D"; // Default to "1D" if unknown
		}
	};

	// Function to fetch logs based on timeframe
	const fetchLogs = async (selectedTimeframe: string) => {
		setLoading(true);
		setError(null);
		try {
			const option = mapTimeframeToOption(selectedTimeframe);
			const response = await UserDeviceService.getDeviceLogs({
				deviceId,
				option,
			});
			// Assuming response is an array of logs
			if (Array.isArray(response)) {
				setLogs(response);
				setTimeframe(selectedTimeframe);
			} else {
				throw new Error("Invalid data format received from API.");
			}
		} catch (err) {
			console.error("Error fetching device logs:", err);
			setError("Failed to load data. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	// Prepare data for the selected metric
	const data = useMemo(() => {
		if (!logs || logs.length === 0) {
			return {
				labels: [],
				datasets: [
					{
						data: [],
						color: (opacity = 1) =>
							selectedMetric === "Temperature"
								? `rgba(255, 87, 34, ${opacity})` // Orange for Temperature
								: `rgba(33, 150, 243, ${opacity})`, // Blue for Humidity
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

		// Sort logs in ascending order based on created_at
		const sortedLogs = [...logs].sort(
			(a, b) =>
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		);

		// Debugging: Log the sorted logs
		console.log("Sorted Logs:", sortedLogs);

		// Validate and extract data points
		const labels: string[] = [];
		const dataPoints: number[] = [];

		sortedLogs.forEach((log) => {
			const date = new Date(log.created_at);
			const label = date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
			labels.push(label);

			const reading =
				selectedMetric === "Temperature"
					? Number(log.temp_sensor_reading)
					: Number(log.humid_sensor_reading);

			// Validate reading
			if (isNaN(reading)) {
				console.warn(`Invalid reading for log ID ${log.id}:`, reading);
				dataPoints.push(0); // Assign a default value or handle as needed
			} else {
				dataPoints.push(reading);
			}
		});

		// Debugging: Log the chart data
		console.log("Chart Labels:", labels);
		console.log("Chart Data Points:", dataPoints);

		return {
			labels,
			datasets: [
				{
					data: dataPoints,
					color: (opacity = 1) =>
						selectedMetric === "Temperature"
							? `rgba(255, 87, 34, ${opacity})` // Orange for Temperature
							: `rgba(33, 150, 243, ${opacity})`, // Blue for Humidity
					strokeWidth: 3,
				},
			],
			legend: [
				selectedMetric === "Temperature" ? "Temperature (°C)" : "Humidity (%)",
			],
		};
	}, [logs, selectedMetric]);

	// Render Content Based on State
	const renderContent = () => {
		if (loading) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#4CAF50" />
					<Text style={styles.loadingText}>Loading Chart...</Text>
				</View>
			);
		}

		if (error) {
			return (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={() => fetchLogs(timeframe)}
						accessibilityLabel="Retry fetching logs"
					>
						<Text style={styles.retryButtonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			);
		}

		if (!fontsLoaded) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="small" color="#4CAF50" />
					<Text style={styles.loadingText}>Loading Fonts...</Text>
				</View>
			);
		}

		// Additional Debugging: Log the data being passed to LineChart
		console.log("Chart Data:", data);

		return (
			<>
				{/* Header with Toggle */}
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
								selectedMetric === "Temperature" &&
									styles.toggleButtonTextActive,
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

				{/* Chart Section */}
				<Text style={styles.title}>
					{selectedMetric === "Temperature"
						? "Temperature Over Time (°C)"
						: "Humidity Over Time (%)"}
				</Text>
				<View style={styles.chartWrapper}>
					<LineChart
						data={data}
						width={Dimensions.get("window").width - 32}
						height={250}
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
								fontFamily: "GeistMedium",
								fontSize: 12,
							},
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
							onPress={() => fetchLogs(label)}
							disabled={loading} // Disable when loading
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
			</>
		);
	};

	return <View style={styles.container}>{renderContent()}</View>;
};

// Styles
const styles = StyleSheet.create({
	container: {
		marginTop: 20,
		padding: 16,
		backgroundColor: "#FFF",
		borderRadius: 10,
		elevation: 3,
		overflow: "hidden",
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
	loadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	loadingText: {
		marginLeft: 10,
		fontSize: 16,
		color: "#4CAF50",
		fontFamily: "GeistMedium",
	},
	errorContainer: {
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	errorText: {
		color: "#D32F2F",
		fontSize: 16,
		marginBottom: 10,
		textAlign: "center",
		fontFamily: "GeistMedium",
	},
	retryButton: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		backgroundColor: "#4CAF50",
		borderRadius: 8,
	},
	retryButtonText: {
		color: "#FFF",
		fontSize: 14,
		fontFamily: "GeistMedium",
	},
});
