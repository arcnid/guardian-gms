// app/(authenticated)/add-device.js
import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	SafeAreaView,
	Alert,
	ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Progress from "react-native-progress"; // For the progress bar

const AddDeviceScreen = () => {
	const router = useRouter();

	// Define the stages
	const stages = ["Select Method", "Connect", "Name Device"];
	const [currentStage, setCurrentStage] = useState(0);
	const [selectedMethod, setSelectedMethod] = useState(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [deviceName, setDeviceName] = useState("");

	// Handle method selection
	const handleMethodSelect = (method) => {
		setSelectedMethod(method);
		setCurrentStage(1); // Move to the connection stage
		// Simulate connection process
		simulateConnection();
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

	// Render different content based on the current stage
	const renderContent = () => {
		switch (currentStage) {
			case 0:
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
							onPress={() => handleMethodSelect("Wi-Fi AP Scan")}
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
});
