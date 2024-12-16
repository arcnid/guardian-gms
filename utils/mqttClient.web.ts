import mqtt, { IClientOptions } from "mqtt";

export const getMqttClient = ({
	brokerUrl,
	options,
	onMessageCallback,
}: {
	brokerUrl: string;
	options: IClientOptions;
	onMessageCallback: (topic: String, data: any) => any;
}) => {
	try {
		const client = mqtt.connect(brokerUrl, options);

		client.on("connect", () => {
			console.log("Connected to MQTT broker (Web)");
		});

		client.on("error", (err) => {
			console.error("MQTT connection error (Web):", err);
		});

		client.on("message", (topic, payload) => {
			try {
				const data = JSON.parse(payload.toString());
				onMessageCallback(topic, data);
			} catch (error) {
				console.error("Error parsing MQTT message (Web):", error);
			}
		});

		return client;
	} catch (error) {
		console.error("Error establishing MQTT connection (Web):", error);
	}
};
