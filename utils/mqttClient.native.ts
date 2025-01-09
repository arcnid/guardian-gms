// import { createMqttClient, MqttConfig } from "@d11/react-native-mqtt";
// import { MqttClient } from "@d11/react-native-mqtt/dist/Mqtt/MqttClient";

// export const getMqttClient = async ({
// 	brokerUrl,
// 	clientId,
// 	options,
// 	onMessageCallback,
// }: {
// 	brokerUrl: string;
// 	clientId: string;
// 	options: any; // Adjust this type as per your needs
// 	onMessageCallback: (topic: string, message: string) => any; // Adjust callback signature if needed
// }) => {
// 	try {
// 		// Create the MQTT client
// 		const client = await createMqttClient({
// 			clientId,
// 			host: brokerUrl,
// 			port: 1883, // Use your actual MQTT broker port
// 			options,
// 		});

// 		// Connect to the broker
// 		await client?.connect();

// 		// Set up a message listener if the library supports it
// 		// Check the library's documentation for the correct event name and parameters

// 		return client;
// 	} catch (error) {
// 		console.error("Error establishing MQTT connection (Native):", error);
// 	}
// };
