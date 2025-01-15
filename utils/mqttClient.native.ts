export const getMqttClient = ({
	brokerUrl,
	topic,
	clientId = `mqtt_ws_ReactNative_${Math.random().toString(16).slice(2, 10)}`,
	onMessageCallback,
	username,
	password,
}: {
	brokerUrl: string;
	topic: string;
	clientId?: string;
	onMessageCallback: (topic: string, payload: string) => void;
	username?: string;
	password?: string;
}) => {
	console.log("Initializing bare-bones MQTT client...");
	console.log("Using broker URL:", brokerUrl);

	const socket = new WebSocket(brokerUrl);
	socket.binaryType = "arraybuffer";

	const encodeString = (str: string): Uint8Array => {
		const length = str.length;
		const buffer = new Uint8Array(length + 2);
		buffer[0] = (length >> 8) & 0xff; // MSB
		buffer[1] = length & 0xff; // LSB
		for (let i = 0; i < length; i++) {
			buffer[i + 2] = str.charCodeAt(i);
		}
		return buffer;
	};

	const encodePacketLength = (length: number): Uint8Array => {
		const encoded = [];
		do {
			let byte = length % 128;
			length = Math.floor(length / 128);
			if (length > 0) byte |= 0x80; // Continuation bit
			encoded.push(byte);
		} while (length > 0);
		return new Uint8Array(encoded);
	};

	const buildConnectPacket = (): Uint8Array => {
		const protocolName = encodeString("MQTT");
		const protocolLevel = new Uint8Array([0x04]); // MQTT 3.1.1
		const connectFlags = new Uint8Array([0x02]); // Clean session
		const keepAlive = new Uint8Array([0x00, 0x3c]); // 60 seconds
		const clientIdBuffer = encodeString(clientId);

		const variableHeader = new Uint8Array([
			...protocolName,
			...protocolLevel,
			...connectFlags,
			...keepAlive,
		]);
		const remainingLength = encodePacketLength(
			variableHeader.length + clientIdBuffer.length
		);

		return new Uint8Array([
			0x10, // CONNECT packet type
			...remainingLength,
			...variableHeader,
			...clientIdBuffer,
		]);
	};

	const buildSubscribePacket = (): Uint8Array => {
		const packetId = new Uint8Array([0x00, 0x01]); // Packet identifier
		const topicBuffer = new Uint8Array([...encodeString(topic), 0x00]); // QoS 0
		const variableHeader = packetId;
		const remainingLength = encodePacketLength(
			variableHeader.length + topicBuffer.length
		);

		return new Uint8Array([
			0x82, // SUBSCRIBE packet type
			...remainingLength,
			...variableHeader,
			...topicBuffer,
		]);
	};

	const buildPublishPacket = (message: string): Uint8Array => {
		const topicBuffer = encodeString(topic);
		const payloadBuffer = new TextEncoder().encode(message);
		const remainingLength = encodePacketLength(
			topicBuffer.length + payloadBuffer.length
		);

		return new Uint8Array([
			0x30, // PUBLISH packet type
			...remainingLength,
			...topicBuffer,
			...payloadBuffer,
		]);
	};

	socket.onopen = () => {
		console.log("WebSocket connection established!");
		socket.send(buildConnectPacket());
		console.log("CONNECT packet sent");

		setTimeout(() => {
			socket.send(buildSubscribePacket());
			console.log("SUBSCRIBE packet sent");
		}, 500);
	};

	socket.onmessage = (event) => {
		const data = new Uint8Array(event.data);
		console.log("Received data:", data);

		if ((data[0] & 0xf0) === 0x30) {
			// PUBLISH packet
			const topicLength = (data[2] << 8) | data[3];
			const topic = new TextDecoder().decode(data.slice(4, 4 + topicLength));
			const payload = new TextDecoder().decode(data.slice(4 + topicLength));
			console.log(`Message received on topic ${topic}: ${payload}`);
			onMessageCallback(topic, payload);
		}
	};

	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};

	socket.onclose = (event) => {
		console.log(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
	};

	return {
		publish: (message: string) => {
			console.log(`Publishing message: ${message}`);
			socket.send(buildPublishPacket(message));
		},
		close: () => {
			console.log("Closing WebSocket connection");
			socket.close();
		},
	};
};
