import React from "react";
import { View, Text, Dimensions } from "react-native";

export const AxisLabel = ({
	value,
	index,
	arrayLength,
	metricType,
}: {
	value: number;
	index: number;
	arrayLength: number;
	metricType: "C" | "%"; // Define the metric type
}): JSX.Element | null => {
	const textColor = "#000"; // Default color
	const location =
		(index / arrayLength) * (Dimensions.get("window").width - 40) || 0;

	return value ? (
		<View style={{ transform: [{ translateX: Math.max(location - 40, 5) }] }}>
			<Text style={{ color: textColor }}>
				{`${value.toFixed(2)} ${metricType}`}
			</Text>
		</View>
	) : null;
};
