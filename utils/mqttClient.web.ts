import mqtt from "mqtt";

export const getMqttClient = ({
	brokerUrl = "mqtt://54.172.46.137:1883", // Default MQTT TCP URL
	topic, // Topic to subscribe to
	onMessageCallback, // Callback for incoming messages
	clientId = `mqtt_web_${Math.random().toString(16).slice(2, 10)}`, // Unique client ID
	username, // Optional username
	password, // Optional password
}: {
	brokerUrl: string;
	topic: string;
	onMessageCallback: (topic: string, payload: string) => void;
	clientId?: string;
	username?: string;
	password?: string;
}) => {
	console.log("Initializing MQTT client...");
	console.log("Using broker URL:", brokerUrl);

	try {
		// Create MQTT client with options
		const client = mqtt.connect(brokerUrl, {
			clientId,
			username,
			password,
		});

		client.on("connect", () => {
			console.log(`Connected to MQTT broker: ${brokerUrl}`);

			// Subscribe to the topic
			client.subscribe(topic, (err) => {
				if (err) {
					console.error(`Subscription to topic ${topic} failed:`, err);
				} else {
					console.log(`Successfully subscribed to topic: ${topic}`);
				}
			});
		});

		client.on("message", (receivedTopic, message) => {
			console.log(
				`Message received on topic ${receivedTopic}:`,
				message.toString()
			);
			if (receivedTopic === topic) {
				onMessageCallback(receivedTopic, message.toString());
			}
		});

		client.on("error", (error) => {
			console.error("MQTT client error:", error);
		});

		client.on("close", () => {
			console.log("MQTT connection closed");
		});

		// Return the client instance for publishing and other actions
		return {
			publish: (publishTopic: string, payload: string) => {
				client.publish(publishTopic, payload, (err) => {
					if (err) {
						console.error(`Failed to publish message to ${publishTopic}:`, err);
					} else {
						console.log(`Message published to ${publishTopic}: ${payload}`);
					}
				});
			},
			end: () => {
				client.end();
				console.log("MQTT client connection ended");
			},
		};
	} catch (error) {
		console.error("Error initializing MQTT client:", error);
	}
};
