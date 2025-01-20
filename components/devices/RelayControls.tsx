import React, { useState, useEffect, useCallback, useContext } from "react";
import {
	Platform,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import { sendService } from "@/services/sendService";
import { AuthContext } from "@/contexts/AuthContext";

export const RelayControls = ({ deviceId }: { deviceId: string }) => {
	const [isRelayOn, setIsRelayOn] = useState(true); // State to track relay power
	const { userId } = useContext(AuthContext);

	if (!userId || !deviceId) {
		return null;
	}

	const topic = `/gms/${userId}/${deviceId}`;
	console.log("topic", topic);

	// Function to publish MQTT messages
	const sendMessage = useCallback(
		(state: boolean) => {
			console.log("Sending message:", state);
			console.log("Topic:", topic);

			sendService.sendPowerCommand({ deviceId, state, userId });
		},
		[userId, deviceId]
	);

	// Turn the relay ON
	const turnRelayOn = () => {
		sendMessage(true);
		setIsRelayOn(true);
	};

	// Turn the relay OFF
	const turnRelayOff = () => {
		sendMessage(false);
		setIsRelayOn(false);
	};

	return (
		<View style={styles.outerContainer}>
			<View style={styles.container}>
				<Text style={styles.title}>Relay Controls</Text>
				<Text style={styles.status}>Power: {isRelayOn ? "ON" : "OFF"}</Text>
				<View style={styles.toggleContainer}>
					<TouchableOpacity
						style={[
							styles.toggleButton,
							isRelayOn && styles.toggleButtonActive,
						]}
						onPress={turnRelayOn}
						disabled={isRelayOn}
					>
						<Text
							style={[
								styles.toggleButtonText,
								isRelayOn && styles.toggleButtonTextActive,
							]}
						>
							Turn ON
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.toggleButton,
							!isRelayOn && styles.toggleButtonActive,
						]}
						onPress={turnRelayOff}
						disabled={!isRelayOn}
					>
						<Text
							style={[
								styles.toggleButtonText,
								!isRelayOn && styles.toggleButtonTextActive,
							]}
						>
							Turn OFF
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	outerContainer: {
		flex: 1,
		backgroundColor: "#F5F5F5",
		borderRadius: 10,
		paddingTop: 10,
		paddingBottom: 10,
		paddingLeft: 5,
		paddingRight: 5,
	},
	container: {
		padding: 16,
		backgroundColor: "#FFF",
		borderRadius: 10,
		elevation: 3,
	},
	title: {
		fontSize: 22,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 10,
		color: "#333",
	},
	status: {
		fontSize: 18,
		textAlign: "center",
		marginBottom: 16,
		color: "#555",
	},
	toggleContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: 16,
	},
	toggleButton: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		backgroundColor: "#F0F0F0",
		flex: 1,
		marginHorizontal: 4,
		alignItems: "center",
	},
	toggleButtonActive: {
		backgroundColor: "#4CAF50", // Active color
	},
	toggleButtonText: {
		fontSize: 16,
		color: "#333",
	},
	toggleButtonTextActive: {
		color: "#FFF", // Text color when active
	},
});
