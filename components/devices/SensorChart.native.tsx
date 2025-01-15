import React, { useState } from "react";
import {
	Dimensions,
	StyleSheet,
	View,
	Text,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import { LineGraph } from "react-native-graph";
import { useDeviceLogs } from "@/hooks/useDeviceLogs";
import { SelectionDot } from "@/components/devices/CustomSelectionDot";
import { AxisLabel } from "@/components/devices/AxisLabel";

const { width } = Dimensions.get("window");

// Define the GraphPoint interface
export interface GraphPoint {
	value: number;
	date: Date;
}

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

	// Find the min and max points
	const minPoint = graphData.reduce(
		(min, p) => (p.value < min.value ? p : min),
		graphData[0] || { value: Infinity, date: new Date() }
	);
	const maxPoint = graphData.reduce(
		(max, p) => (p.value > max.value ? p : max),
		graphData[0] || { value: -Infinity, date: new Date() }
	);

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
							? "Temperature Over Time (C)"
							: "Humidity Over Time (%)"}
					</Text>
				</View>
				<LineGraph
					style={styles.chart}
					points={graphData}
					color="#4CAF50"
					animated={true}
					selectionDotShadowColor="#4CAF50"
					enablePanGesture={true}
					SelectionDot={SelectionDot}
					enableFadeInMask={true}
					enableIndicator={true}
					onGestureStart={() => console.log("Gesture Start")}
					onGestureEnd={() => console.log("Gesture End")}
					horizontalPadding={30}
					indicatorPulsating={true}
					verticalPadding={5}
					gradientFillColors={
						activeTab === "temp" ? ["#FFCCCC", "#FFF"] : ["#CCE5FF", "#FFF"]
					}
					TopAxisLabel={() => (
						<AxisLabel
							value={maxPoint.value}
							index={graphData.findIndex(
								(point) => point.value === maxPoint.value
							)}
							arrayLength={graphData.length}
							metricType={activeTab === "temp" ? "C" : "%"}
						/>
					)}
					BottomAxisLabel={() => (
						<AxisLabel
							value={minPoint.value}
							index={graphData.findIndex(
								(point) => point.value === minPoint.value
							)}
							arrayLength={graphData.length}
							metricType={activeTab === "temp" ? "C" : "%"}
						/>
					)}
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
		backgroundColor: "#fff", // Light background for the app
		marginTop: 20,
		borderRadius: 10,
		paddingTop: 10,
		paddingBottom: 10,
		paddingLeft: 5,
		paddingRight: 5,
	},
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
	},
	chart: {
		borderRadius: 16,
		height: 300,
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
	errorText: {
		color: "#D32F2F",
		fontSize: 14,
		fontFamily: "GeistMedium",
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
