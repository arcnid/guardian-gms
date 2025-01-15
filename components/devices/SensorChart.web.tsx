import React, { useState } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	TouchableOpacity,
	StyleSheet,
} from "react-native";
import { Line } from "react-chartjs-2";
import { useDeviceLogs } from "@/hooks/useDeviceLogs";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from "chart.js";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

export interface GraphPoint {
	value: number;
	date: Date;
}

export const SensorChart = ({ deviceId }: { deviceId: string }) => {
	const [timeframe, setTimeframe] = useState<string>("1D");
	const [activeTab, setActiveTab] = useState<"temp" | "humidity">("temp");

	const { data, loading, error } = useDeviceLogs(deviceId, timeframe);

	const graphData: GraphPoint[] =
		data?.map((log) => ({
			value:
				activeTab === "temp"
					? log.temp_sensor_reading
					: log.humid_sensor_reading,
			date: new Date(log.created_at),
		})) || [];

	const chartData = {
		labels: graphData.map((point) =>
			point.date.toLocaleString(undefined, {
				hour: "numeric",
				minute: "numeric",
			})
		),
		datasets: [
			{
				label: activeTab === "temp" ? "Temperature (C)" : "Humidity (%)",
				data: graphData.map((point) => point.value),
				borderColor:
					activeTab === "temp"
						? "rgba(59, 89, 152, 1)"
						: "rgba(76, 175, 80, 1)",
				backgroundColor:
					activeTab === "temp"
						? "rgba(59, 89, 152, 0.2)"
						: "rgba(76, 175, 80, 0.2)",
				fill: true,
				tension: 0.4,
				pointRadius: 4,
				pointHoverRadius: 6,
				pointHoverBorderWidth: 2,
			},
		],
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		showLine: true,
		plugins: {
			tooltip: {
				backgroundColor: "rgba(0, 0, 0, 0.8)",
				bodyFont: { size: 14 },
				titleFont: { size: 16 },
				displayColors: false,
			},
		},
		animation: {
			duration: 1000,
			easing: "easeInOutQuad",
		},
		scales: {
			x: {
				title: {
					display: true,
					text: "Time",
					color: "#888",
					font: {
						size: 14,
					},
				},
				ticks: {
					color: "#666",
				},
			},
			y: {
				title: {
					display: true,
					text: activeTab === "temp" ? "Temperature (C)" : "Humidity (%)",
					color: "#888",
					font: {
						size: 14,
					},
				},
				ticks: {
					color: "#666",
				},
			},
		},
	};

	let content = null;

	if (loading) {
		content = (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#3b5998" />
				<Text style={styles.loadingText}>Loading...</Text>
			</View>
		);
	} else if (error) {
		content = (
			<View style={styles.container}>
				<Text style={styles.errorText}>{error}</Text>
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
			<View style={styles.graphContainer}>
				<View>
					<Text style={styles.chartTitle}>
						{activeTab === "temp"
							? "Temperature Over Time (C)"
							: "Humidity Over Time (%)"}
					</Text>
				</View>
				<View style={{ height: 300 }}>
					<Line data={chartData} options={chartOptions} />
				</View>
			</View>
		);
	}

	return (
		<View style={styles.outerContainer}>
			{/* Tabs for Temperature and Humidity */}
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

			{content}

			{/* Timeframe Buttons */}
			<View style={styles.buttonContainer}>
				{["1D", "1W", "1M", "1Y", "MAX"].map((label) => (
					<TouchableOpacity
						key={label}
						style={[styles.button, timeframe === label && styles.activeButton]}
						onPress={() => setTimeframe(label)}
					>
						<Text
							style={[
								styles.buttonText,
								timeframe === label && styles.activeButtonText,
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
		padding: 20,
		marginTop: 20,
		borderRadius: 10,
	},
	container: {
		marginTop: 20,
		padding: 20,
		backgroundColor: "#FFF",
		borderRadius: 10,
		boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
	},
	graphContainer: {
		flex: 1,
		backgroundColor: "#FFF",
		borderRadius: 10,
	},
	chartTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
		textAlign: "center",
	},
	toggleContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: 16,
	},
	toggleButton: {
		paddingVertical: 10,
		paddingHorizontal: 15,
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
		fontWeight: "bold",
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 16,
	},
	button: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: "#e0e0e0",
		elevation: 2,
	},
	activeButton: {
		backgroundColor: "#3b5998",
	},
	buttonText: {
		color: "#000",
		fontSize: 14,
	},
	activeButtonText: {
		color: "#FFF",
		fontWeight: "bold",
	},
	errorText: {
		color: "red",
		fontSize: 16,
	},
	loadingText: {
		marginTop: 10,
		color: "#555",
		fontSize: 14,
		textAlign: "center",
	},
});
