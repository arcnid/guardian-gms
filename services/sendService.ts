const hostURL = "http://34.238.60.126:5000"; // Ensure it has http:// or https://

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
			userId,
			deviceId,
			data: {
				power: state,
			},
		};

		console.log("object body", objectBody);

		const res = await fetch(`${hostURL}/sendComand`, {
			// Now it's absolute
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(objectBody),
		});

		console.log(res);

		const data = await res.json();
		return data;
	},
};
