import React, { useState } from "react";
import {
	Dimensions,
	StyleSheet,
	View,
	Text,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useDeviceLogs } from "@/hooks/useDeviceLogs";

const { width } = Dimensions.get("window");

// Define the GraphPoint interface
export interface GraphPoint {
	value: number;
	date: Date;
}

const chartConfig = {
	backgroundGradientFrom: "#fff", // Set to white
	backgroundGradientTo: "#fff", // Set to white
	color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
	strokeWidth: 2,
	barPercentage: 0.5,
	useShadowColorFromDataset: false,
};

export const SensorChart = ({ deviceId }: { deviceId: string }) => {
	// State to manage the selected timeframe and active tab (temp/humidity)
	const [timeframe, setTimeframe] = useState<string>("1D");
	const [activeTab, setActiveTab] = useState<"temp" | "humidity">("temp");

	// Fetch device logs using the custom hook
	const { data, loading, error } = useDeviceLogs(deviceId, timeframe);

	// Map fetched data to GraphPoint[]
	const graphData: GraphPoint[] =
		data?.map((log) => ({
			value:
				activeTab === "temp"
					? log.temp_sensor_reading
					: log.humid_sensor_reading,
			date: new Date(log.created_at),
		})) || [];

	// Prepare data for the chart
	const labels = graphData.map((point) => point.date.toLocaleDateString());

	// Function to format labels: show only first, middle, and last
	const formatLabels = (labels: string[]) => {
		const count = labels.length;
		if (count <= 3) {
			return labels; // No need to format if 3 or fewer labels
		}
		const middleIndex = Math.floor(count / 2);
		return labels.map((label, index) => {
			if (index === 0 || index === middleIndex || index === count - 1) {
				return label;
			}
			return "";
		});
	};

	const formattedLabels = formatLabels(labels);

	const chartData = {
		labels: formattedLabels,
		datasets: [
			{
				data: graphData.map((point) => point.value),
			},
		],
	};

	// Conditional rendering for loading, error, or no data
	let content = null;

	if (loading) {
		content = (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#4CAF50" />
				<Text style={styles.fontLoadingText}>Loading...</Text>
			</View>
		);
	} else if (error) {
		content = (
			<View style={[styles.container, styles.errorInline]}>
				<Text style={styles.errorText}>{error}</Text>
				<TouchableOpacity
					style={styles.retryButton}
					onPress={() => setTimeframe(timeframe)}
				>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	} else if (!graphData.length) {
		content = (
			<View style={styles.container}>
				<Text>No data available for the selected timeframe.</Text>
			</View>
		);
	} else {
		content = (
			<View style={styles.chartWrapper}>
				<View>
					<Text style={styles.title}>
						{activeTab === "temp"
							? "Temperature Over Time (°C)"
							: "Humidity Over Time (%)"}
					</Text>
				</View>
				<LineChart
					data={chartData}
					width={width - 40}
					height={220}
					chartConfig={chartConfig}
					bezier
					style={styles.chart}
				/>
			</View>
		);
	}

	return (
		<View style={styles.outerContainer}>
			{/* Render Tabs */}
			<View style={styles.toggleContainer}>
				<TouchableOpacity
					style={[
						styles.toggleButton,
						activeTab === "temp" && styles.toggleButtonActive,
					]}
					onPress={() => setActiveTab("temp")}
				>
					<Text
						style={[
							styles.toggleButtonText,
							activeTab === "temp" && styles.toggleButtonTextActive,
						]}
					>
						Temperature
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.toggleButton,
						activeTab === "humidity" && styles.toggleButtonActive,
					]}
					onPress={() => setActiveTab("humidity")}
				>
					<Text
						style={[
							styles.toggleButtonText,
							activeTab === "humidity" && styles.toggleButtonTextActive,
						]}
					>
						Humidity
					</Text>
				</TouchableOpacity>
			</View>

			{/* Render Graph or Message */}
			{content}

			{/* Timeframe Buttons */}
			<View style={styles.buttonContainer}>
				{["1D", "1W", "1M", "1Y", "MAX"].map((label) => (
					<TouchableOpacity
						key={label}
						style={[styles.button, timeframe === label && styles.buttonActive]}
						onPress={() => setTimeframe(label)}
					>
						<Text
							style={[
								styles.buttonText,
								timeframe === label && styles.buttonTextActive,
							]}
						>
							{label}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	outerContainer: {
		flex: 1,
		backgroundColor: "#fff",
		marginTop: 10,
		borderRadius: 10,
		paddingTop: 10,
		paddingBottom: 10,
		paddingLeft: 5,
		paddingRight: 5,
		elevation: 3,
	},
	container: {
		marginTop: 20,
		padding: 16,
		backgroundColor: "#FFF",
		borderRadius: 10,
		elevation: 3,
		alignItems: "center",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
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
		fontSize: 14,
		color: "#333",
	},
	buttonTextActive: {
		color: "#FFF",
	},
	errorText: {
		color: "#D32F2F",
		fontSize: 14,
		marginBottom: 10,
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
	},
	fontLoadingText: {
		marginTop: 8,
		color: "#999",
		fontSize: 12,
		textAlign: "center",
	},
	errorInline: {
		justifyContent: "center",
		alignItems: "center",
	},
});
