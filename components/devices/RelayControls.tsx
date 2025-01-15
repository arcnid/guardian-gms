import React, { useState, useEffect, useCallback, useContext } from "react";
import {
	Platform,
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import { getMqttClient } from "@/utils/mqttClient"; // Web-specific MQTT client
import { AuthContext } from "@/contexts/AuthContext";

export const RelayControls = ({ deviceId }: { deviceId: string }) => {
	const [isRelayOn, setIsRelayOn] = useState(true); // State to track relay power
	const [mqttClient, setMqttClient] = useState<any>(null); // MQTT client instance
	const { userId } = useContext(AuthContext);

	if (!userId || !deviceId) {
		return null;
	}

	const topic = `/gms/${userId}/${deviceId}`;
	console.log("topic", topic);

	// Initialize the MQTT client based on the platform
	useEffect(() => {
		let client: any;

		const initializeClient = async () => {
			if (Platform.OS === "web") {
				// Web: Use the existing web MQTT client
				client = getMqttClient({
					brokerUrl: "ws://54.172.46.137:9001", // WebSocket URL
					topic,
					onMessageCallback: (topic: string, payload: string) => {
						console.log("Message received on web:", topic, payload);
					},
				});
			} else {
				// Native: Use the native MQTT client
				console.log("trying native");
				client = await getMqttClient({
					brokerUrl: "ws://54.172.46.137:9001", // WebSocket URL for native
					topic,
					onMessageCallback: (topic: string, payload: string) => {
						console.log("Message received on native:", topic, payload);
					},
				});
			}

			setMqttClient(client);
		};

		initializeClient();

		// Cleanup function to disconnect and clean up the MQTT client
		return () => {
			if (client) {
				if (Platform.OS === "web") {
					client.unsubscribe(topic);
					client.end();
				} else {
					client.close();
				}
			}
		};
	}, [deviceId, topic]);

	// Function to publish MQTT messages
	const sendMessage = useCallback(
		(state: boolean) => {
			console.log("Sending message:", state);
			console.log("Topic:", topic);

			if (mqttClient) {
				if (Platform.OS === "web") {
					mqttClient.publish(topic, JSON.stringify({ power: state }));
				} else {
					console.log("about to publish on mobile");

					mqttClient.publish(JSON.stringify({ topic, power: state }));
				}
			}
		},
		[mqttClient, topic]
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
