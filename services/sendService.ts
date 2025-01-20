const hostURL = process.env.hostURL;

export const sendService = {
	sendPowerCommand: async ({
		userId,
		deviceId,
		state,
	}: {
		userId: string;
		deviceId: string;
		state: boolean;
	}) => {
		console.log("sending power state");
		console.log(hostURL);
		console.log(state);
		const objectBody = {
			userId: "123",
			deviceId: "1223",
			data: {
				command: "clearEEPROM",
			},
		};
		const res = await fetch(`${hostURL}:5000/sendComand`, {
			method: "post",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(objectBody),
		});

		const data = await res.json();

		return data;
	},
};
