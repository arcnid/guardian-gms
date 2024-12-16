// app/(authenticated)/add-device.js
import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	SafeAreaView,
	Alert,
	ActivityIndicator,
	FlatList,
	Platform,
	TextInput,
	Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native"; // Added import
import * as Progress from "react-native-progress"; // For the progress bar
import { parseQueryParams } from "expo-router/build/fork/getStateFromPath-forks";
import { AuthService } from "@/services/authService";
import { v4 as uuidv4 } from "uuid";
import { linkDeviceToUser } from "@/utils/addDevice";
import "react-native-get-random-values";
import { getMqttClient } from "@/utils/mqttClient";

const BrokerUrl =
	"wss://812d2adb6dfb490f812a58bb370668c9.s1.eu.hivemq.cloud:8884/mqtt";
const BrokerPort = "8884";

const AddDeviceScreen = () => {
	const router = useRouter();

	// Define the stages
	const stages = ["Select Method", "Connect", "Name Device"];
	const [currentStage, setCurrentStage] = useState(0);
	const [selectedMethod, setSelectedMethod] = useState(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [deviceName, setDeviceName] = useState("");
	const [wifiNetworks, setWifiNetworks] = useState([]); // New state for WiFi networks
	const [selectedNetwork, setSelectedNetwork] = useState(null); // New state for selected network

	// New state variables for password prompt
	const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
	const [wifiPassword, setWifiPassword] = useState("");
	const [selectedSecureNetwork, setSelectedSecureNetwork] = useState(null);

	//for reference when offline
	const [userId, setUserId] = useState(null);

	// Reset state when the screen is focused
	useFocusEffect(
		React.useCallback(() => {
			// Reset all state variables to initial values
			setCurrentStage(0);
			setSelectedMethod(null);
			setIsConnecting(false);
			setDeviceName("");
			setWifiNetworks([]);
			setSelectedNetwork(null);
			setIsPasswordModalVisible(false);
			setWifiPassword("");
			setSelectedSecureNetwork(null);
		}, [])
	);

	useEffect(() => {
		const fetchUserId = async () => {
			console.log("fetching user id");
			try {
				const id = await AuthService.getCurrentUser();

				console.log("setting", id.data.user.id);
				setUserId(id.data.user.id); // Store the userId in state
			} catch (error) {
				console.error("Error fetching user ID:", error);
			}
		};

		fetchUserId();
	}, []);

	useEffect(() => {
		if (Platform.OS == "web") {
			// const client = getMqttClient({
			// 	brokerUrl: BrokerUrl,
			// 	options: {
			// 		username: "username",
			// 		password: "sdhBkb7!",
			// 		clientId: `mqtt_${Math.random().toString(16).slice(2, 8)}`,
			// 	},
			// 	onMessageCallback: (topic, data) => {},
			// });
			// client.subscribe(`/gms/user/${userId}`, (err: any) => {
			// 	if (!err) {
			// 		console.log("Subscribed to the topic", `/gms/user/${userId}`);
			// 	} else {
			// 		console.error("Failed to connect to topic", err.message);
			// 	}
			// });
			// client.on("message", (topic, payload) => {
			// 	try {
			// 		// Convert payload from Buffer to string
			// 		const stringified = payload.toString();
			// 		// Parse JSON
			// 		const data = JSON.parse(stringified);
			// 		// Destructure fields
			// 		const { userId, deviceId, timestamp } = data;
			// 		if (timestamp) {
			// 			// Convert timestamp to Date object and then to a millisecond value
			// 			const messageTime = new Date(timestamp).getTime();
			// 			// Get the current time in milliseconds
			// 			const currentTime = Date.now();
			// 			// Check if timestamp is valid
			// 			if (isNaN(messageTime)) {
			// 				console.log("Invalid timestamp format.");
			// 				return;
			// 			}
			// 			// Calculate the time difference in milliseconds
			// 			const timeDifference = currentTime - messageTime;
			// 			// Check if the message is less than 1 hour old
			// 			if (timeDifference <= 3600000) {
			// 				// 1 hour = 3600000 ms
			// 				linkDeviceToUser({ userId, deviceId });
			// 				console.log("Message processed successfully.");
			// 			} else {
			// 				console.log("Message is too old.");
			// 			}
			// 		} else {
			// 			console.log("Timestamp missing from the message.");
			// 		}
			// 	} catch (error) {
			// 		console.error("Failed to process message:", error);
			// 	}
			// });
		} else {
			const client = getMqttClient({
				brokerUrl: BrokerUrl,
				clientId: `mqtt_${Math.random().toString(16).slice(2, 8)}`,
				options: {
					port: 8884,
				},
			});
		}
	}, [userId]);

	// declar the mqtt client and subscribe to the topic "/gms/user/${userId}"
	// useEffect(() => {
	// 	console.log("Connecting to broker");

	// 	try {
	// 		const client = mqtt.connect(BrokerUrl, {
	// 			username: "username", // Replace with actual username
	// 			password: "sdhBkb7!", // Replace with actual password
	// 			clientId: `mqtt_${Math.random().toString(16).slice(2, 8)}`, // Unique client ID
	// 		});

	// 		client.on("connect", () => {
	// 			console.log("Connected to MQTT broker");
	// 		});

	// 		client.on("error", (err) => {
	// 			console.error("MQTT connection error:", err);
	// 		});

	// 		client.subscribe(`/gms/user/${userId}`, (err: any) => {
	// 			if (!err) {
	// 				console.log("Subscribed to the topic", `/gms/user/${userId}`);
	// 			} else {
	// 				console.error("Failed to connect to topic", err.message);
	// 			}
	// 		});

	// 		client.on("message", (topic, payload) => {
	// 			try {
	// 				// Convert payload from Buffer to string
	// 				const stringified = payload.toString();

	// 				// Parse JSON
	// 				const data = JSON.parse(stringified);

	// 				// Destructure fields
	// 				const { userId, deviceId, timestamp } = data;

	// 				if (timestamp) {
	// 					// Convert timestamp to Date object and then to a millisecond value
	// 					const messageTime = new Date(timestamp).getTime();

	// 					// Get the current time in milliseconds
	// 					const currentTime = Date.now();

	// 					// Check if timestamp is valid
	// 					if (isNaN(messageTime)) {
	// 						console.log("Invalid timestamp format.");
	// 						return;
	// 					}

	// 					// Calculate the time difference in milliseconds
	// 					const timeDifference = currentTime - messageTime;

	// 					// Check if the message is less than 1 hour old
	// 					if (timeDifference <= 3600000) {
	// 						// 1 hour = 3600000 ms
	// 						linkDeviceToUser({ userId, deviceId });
	// 						console.log("Message processed successfully.");
	// 					} else {
	// 						console.log("Message is too old.");
	// 					}
	// 				} else {
	// 					console.log("Timestamp missing from the message.");
	// 				}
	// 			} catch (error) {
	// 				console.error("Failed to process message:", error);
	// 			}
	// 		});
	// 	} catch (e) {
	// 		console.error("Error establishing MQTT connection");
	// 	}
	// }, [userId]);

	const connectToWifi = async (network: string, password = "") => {
		const payload = {
			ssid: network,
			password,
			userId: userId,
			deviceId: uuidv4(),
		};

		console.log("Sending network details to embedded device");

		try {
			const response = await fetch("http://192.168.4.1/connect", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				Alert.alert(
					"Connection Error",
					"Failed to connect to the WiFi network."
				);
			}

			const result = await response.json();

			if (result.message == "Success") {
				return true;
			} else {
				Alert.alert(
					"Connection Error",
					result.message || "Failed to connect to the WiFi netowrk."
				);
				return false;
			}

			console.log("WiFi Connection Result: ", result.message);

			linkDeviceToUser({ deviceId: payload.deviceId, userId: userId as any });
		} catch (e) {
			console.error(e);
			return false;
		}
	};

	const apConnection = async () => {
		setSelectedMethod("AP Scan"); // Set the selected method to AP Scan
		setCurrentStage(1); // Move to the connecting stage
		setIsConnecting(true); // Show spinner

		// Define the fallback IP
		const fallBackAPIP = "192.168.4.1";

		// Define a timeout duration in milliseconds
		const timeoutDuration = 10000; // 10 seconds

		// Create an AbortController
		const controller = new AbortController();
		const timeout = setTimeout(() => {
			controller.abort(); // Abort the request if it takes too long
		}, timeoutDuration);

		try {
			console.log("About to hit the endpoint");
			console.log("http://192.168.4.1/scanWifi");

			// Perform the fetch request with the AbortController signal
			const result = await fetch("http://192.168.4.1/scanWifi", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				signal: controller.signal, // Pass the signal
			});

			// Clear the timeout if the request is successful
			clearTimeout(timeout);

			// Check for errors in the response
			if (!result.ok) {
				if (Platform.OS === "web") {
					window.alert("Failed to connect to the device");
				}
				Alert.alert("Error", "Failed to connect to the device");
				setIsConnecting(false); // Hide spinner
				setCurrentStage(0); // Go back to options
				return;
			}

			// Parse the JSON response
			const response = await result.json();
			console.log("Fetched WiFi Networks:", response);

			// Process the response data
			if (response.data && Array.isArray(response.data)) {
				setWifiNetworks(response.data);
				// Move back to the selection stage to show networks
				setCurrentStage(0);
			} else {
				console.log("Unexpected data format:", response);
				Alert.alert("Error", "Unexpected data format received.");
				setCurrentStage(0);
			}
		} catch (error) {
			console.log("Oops, an error occurred:", error);

			// Check if the error is due to timeout
			if (error.name === "AbortError") {
				Alert.alert("Timeout", "The request timed out.");
			} else {
				Alert.alert("Error", "An error occurred while connecting.");
			}
		} finally {
			// Clear the timeout to prevent memory leaks
			clearTimeout(timeout);
			setIsConnecting(false); // Hide spinner
		}
	};

	// Handle method selection
	const handleMethodSelect = (method: any) => {
		setSelectedMethod(method);
		setCurrentStage(1); // Move to the connection stage
		// Simulate connection process
		simulateConnection();
	};

	// Handle WiFi network selection
	const handleWifiNetworkSelect = async (network: any) => {
		if (network.security && network.security !== "Open") {
			// If the network is secured, prompt for password
			setSelectedSecureNetwork(network);
			setIsPasswordModalVisible(true);
		} else {
			// If the network is open, proceed without password
			setSelectedNetwork(network);
			setCurrentStage(1);
			setIsConnecting(true);

			const success = await connectToWifi(network);

			if (success) {
				simulateConnection();
			} else {
				setCurrentStage(0);
			}
		}
	};

	// Function to handle password submission
	const handlePasswordSubmit = async () => {
		if (wifiPassword.trim() === "") {
			Alert.alert("Validation Error", "Please enter the WiFi password.");
			return;
		}

		const payload = {
			ssid: selectedSecureNetwork.ssid,
			password: wifiPassword,
			userId,
			deviceId: uuidv4(),
		};

		console.log("about to send a payload", payload);

		try {
			const response = await fetch(`http://192.168.4.1/connect`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			console.log(response);

			if (!response.ok) {
				Alert.alert(
					"Connection Error",
					"Failed to connect to the WiFi network."
				);
				return;
			}

			console.log("got message back");

			const result = await response.json();
			console.log("WiFi Connection Result:", result);

			// Assuming a successful connection returns a success message
			if (result.status === "Success") {
				setIsPasswordModalVisible(false);
				setWifiPassword("");
				setSelectedNetwork(selectedSecureNetwork);
				setCurrentStage(1); // Move to the connection stage
				// Simulate connection process
				linkDeviceToUser({ deviceId: payload.deviceId, userId: userId as any });
				simulateConnection();
			} else {
				Alert.alert(
					"Connection Error",
					result.message || "Failed to connect to the WiFi network."
				);
			}
		} catch (error) {
			console.log("WiFi Connection Error:", error);
			Alert.alert(
				"Error",
				"An error occurred while connecting to the WiFi network."
			);
		}
	};

	// Simulate a connection process (Replace with actual logic)
	const simulateConnection = () => {
		setIsConnecting(true);
		setTimeout(() => {
			setIsConnecting(false);
			setCurrentStage(2); // Move to the naming stage
		}, 2000); // Simulate a 2-second connection
	};

	// Handle device naming
	const handleNameDevice = () => {
		if (deviceName.trim() === "") {
			Alert.alert("Validation Error", "Please enter a device name.");
			return;
		}
		// Simulate saving the device
		Alert.alert("Success", `Device "${deviceName}" added successfully!`);
		// Reset the process or navigate away
		router.back();
	};

	// Function to determine signal strength based on signal_level
	const getSignalStrength = (signal_level) => {
		if (signal_level >= -50) return 4; // Excellent
		if (signal_level >= -60) return 3; // Good
		if (signal_level >= -70) return 2; // Fair
		return 1; // Weak
	};

	// Render different content based on the current stage
	const renderContent = () => {
		switch (currentStage) {
			case 0:
				if (selectedMethod === "AP Scan" && wifiNetworks.length > 0) {
					return (
						<FlatList
							data={wifiNetworks}
							keyExtractor={(item, index) => `${item.ssid}-${index}`} // Ensuring unique keys
							renderItem={({ item }) => (
								<TouchableOpacity
									style={styles.wifiOptionCard}
									onPress={() => handleWifiNetworkSelect(item)}
								>
									<View style={styles.wifiIconContainer}>
										<MaterialIcons name="wifi" size={24} color="#71A12F" />
									</View>
									<View style={styles.wifiInfoContainer}>
										<Text style={styles.wifiSsidText}>
											{item.ssid || "Hidden Network"}
										</Text>
										<View style={styles.wifiDetailsRow}>
											{item.security === "Open" ? (
												<MaterialIcons
													name="lock-open"
													size={16}
													color="#888"
												/>
											) : (
												<MaterialIcons name="lock" size={16} color="#888" />
											)}
											<Text style={styles.wifiSecurityText}>
												{item.security || "Unknown"}
											</Text>
										</View>
									</View>
									<View style={styles.signalStrengthContainer}>
										{[1, 2, 3, 4].map((level) => (
											<View
												key={level}
												style={[
													styles.signalBar,
													level <= getSignalStrength(item.signal_level)
														? styles.signalBarActive
														: styles.signalBarInactive,
												]}
											/>
										))}
									</View>
								</TouchableOpacity>
							)}
							contentContainerStyle={{ flexGrow: 1 }}
							style={{ flex: 1 }}
						/>
					);
				} else {
					return (
						<View style={styles.optionsContainer}>
							<TouchableOpacity
								style={styles.optionCard}
								onPress={() => handleMethodSelect("Bluetooth")}
							>
								<MaterialIcons name="bluetooth" size={40} color="#71A12F" />
								<Text style={styles.optionText}>Add Via Bluetooth</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.optionCard}
								onPress={() => apConnection()}
							>
								<MaterialIcons name="wifi" size={40} color="#71A12F" />
								<Text style={styles.optionText}>Add Via WIFI (AP Scan)</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.optionCard}
								onPress={() => handleMethodSelect("Scan Network")}
							>
								<MaterialIcons name="network-check" size={40} color="#71A12F" />
								<Text style={styles.optionText}>Scan Network</Text>
							</TouchableOpacity>
						</View>
					);
				}

			case 1:
				return (
					<View style={styles.connectionContainer}>
						<Text style={styles.statusText}>
							Connecting via {selectedMethod}...
						</Text>
						<ActivityIndicator
							size="large"
							color="#71A12F"
							style={{ marginTop: 20 }}
						/>
					</View>
				);

			case 2:
				return (
					<View style={styles.namingContainer}>
						<Text style={styles.statusText}>Assign a Name to Your Device</Text>
						<TouchableOpacity
							style={styles.nameInput}
							onPress={() => {
								// Implement actual input logic or navigation to a form
								Alert.prompt(
									"Device Name",
									"Enter a name for your device:",
									[
										{
											text: "Cancel",
											style: "cancel",
										},
										{
											text: "OK",
											onPress: (text) => {
												setDeviceName(text);
											},
										},
									],
									"plain-text"
								);
							}}
						>
							<Text style={styles.nameInputText}>
								{deviceName || "Tap to enter device name"}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.proceedButton,
								{ backgroundColor: deviceName ? "#71A12F" : "#ccc" },
							]}
							onPress={handleNameDevice}
							disabled={!deviceName}
						>
							<Text style={styles.buttonText}>Add Device</Text>
						</TouchableOpacity>
					</View>
				);

			default:
				return null;
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* Status Bar */}
			<View style={styles.statusBar}>
				{stages.map((stage, index) => (
					<View key={index} style={styles.statusStepContainer}>
						<View
							style={[
								styles.statusCircle,
								currentStage >= index && styles.statusCircleActive,
							]}
						>
							<Text
								style={[
									styles.statusNumber,
									currentStage >= index && styles.statusNumberActive,
								]}
							>
								{index + 1}
							</Text>
						</View>
						{index < stages.length - 1 && (
							<View
								style={[
									styles.statusLine,
									currentStage > index && styles.statusLineActive,
								]}
							/>
						)}
					</View>
				))}
			</View>

			{/* Main Content */}
			<View style={styles.content}>{renderContent()}</View>

			{/* Password Prompt Modal */}
			<Modal
				visible={isPasswordModalVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setIsPasswordModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>
							Enter Password for "{selectedSecureNetwork?.ssid}"
						</Text>
						<TextInput
							style={styles.modalInput}
							placeholder="WiFi Password"
							secureTextEntry={true}
							value={wifiPassword}
							onChangeText={setWifiPassword}
						/>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={styles.modalButtonCancel}
								onPress={() => {
									setIsPasswordModalVisible(false);
									setWifiPassword("");
								}}
							>
								<Text style={styles.modalButtonText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.modalButtonConfirm,
									{ backgroundColor: wifiPassword ? "#71A12F" : "#ccc" },
								]}
								onPress={handlePasswordSubmit}
								disabled={!wifiPassword}
							>
								<Text style={styles.modalButtonText}>Connect</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};

export default AddDeviceScreen;

// Stylesheet
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	statusBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 20,
	},
	statusStepContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	statusCircle: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: "#ccc",
		justifyContent: "center",
		alignItems: "center",
	},
	statusCircleActive: {
		backgroundColor: "#71A12F",
	},
	statusNumber: {
		color: "#fff",
		fontWeight: "bold",
	},
	statusNumberActive: {
		color: "#fff",
	},
	statusLine: {
		width: 50,
		height: 4,
		backgroundColor: "#ccc",
		marginHorizontal: 5,
	},
	statusLineActive: {
		backgroundColor: "#71A12F",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	optionsContainer: {
		flex: 1,
		justifyContent: "center",
	},
	optionCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		padding: 20,
		marginBottom: 20,
		alignItems: "center",
		elevation: 3, // Android shadow
		shadowColor: "#000", // iOS shadow
		shadowOffset: { width: 0, height: 2 }, // iOS shadow
		shadowOpacity: 0.1, // iOS shadow
		shadowRadius: 3, // iOS shadow
	},
	optionText: {
		marginTop: 10,
		fontSize: 16,
		color: "#333",
		textAlign: "center",
	},
	connectionContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	statusText: {
		fontSize: 18,
		color: "#333",
		textAlign: "center",
	},
	namingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	nameInput: {
		backgroundColor: "#FFFFFF",
		borderRadius: 8,
		width: "100%",
		padding: 15,
		marginBottom: 20,
		justifyContent: "center",
		alignItems: "center",
		elevation: 2, // Android shadow
		shadowColor: "#000", // iOS shadow
		shadowOffset: { width: 0, height: 1 }, // iOS shadow
		shadowOpacity: 0.1, // iOS shadow
		shadowRadius: 2, // iOS shadow
	},
	nameInputText: {
		color: "#888",
		fontSize: 16,
	},
	proceedButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 15,
		borderRadius: 8,
		width: "100%",
		alignItems: "center",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
	// New Styles for WiFi List Items
	wifiOptionCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		padding: 15,
		marginBottom: 15,
		elevation: 2, // Android shadow
		shadowColor: "#000", // iOS shadow
		shadowOffset: { width: 0, height: 1 }, // iOS shadow
		shadowOpacity: 0.1, // iOS shadow
		shadowRadius: 2, // iOS shadow
	},
	wifiIconContainer: {
		marginRight: 15,
	},
	wifiInfoContainer: {
		flex: 1,
	},
	wifiSsidText: {
		fontSize: 16,
		color: "#333",
		fontWeight: "500",
	},
	wifiDetailsRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 5,
	},
	wifiSecurityText: {
		fontSize: 14,
		color: "#666",
		marginLeft: 5,
	},
	signalStrengthContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginLeft: 10,
	},
	signalBar: {
		width: 4,
		height: 10,
		backgroundColor: "#ccc",
		marginHorizontal: 1,
		borderRadius: 2,
	},
	signalBarActive: {
		backgroundColor: "#71A12F",
	},
	signalBarInactive: {
		backgroundColor: "#ccc",
	},
	// New Styles for Password Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		width: "80%",
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 20,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#333",
		textAlign: "center",
	},
	modalInput: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: 10,
		marginBottom: 20,
		fontSize: 16,
	},
	modalButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	modalButtonCancel: {
		backgroundColor: "#ccc",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	modalButtonConfirm: {
		backgroundColor: "#71A12F",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	modalButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
		textAlign: "center",
	},
});
