// largestTriangleThreeBuckets.ts
// This is a generic LTTB implementation that returns the original rows.
// We assume each row has at least a 'created_at' and a 'temp_sensor_reading'.

/**
 * largestTriangleThreeBuckets
 *
 * @param data - The array of device log objects (each should have created_at and temp_sensor_reading).
 * @param threshold - The maximum number of points to keep in the reduced set.
 * @returns - A new array (subset of `data`) preserving the same shape, just fewer items.
 */
export function largestTriangleThreeBuckets<
	T extends { created_at: string; temp_sensor_reading: number },
>(data: T[], threshold = 300): T[] {
	// Log original data size
	const dataLength = data.length;

	// If we have fewer than threshold items, return as is
	if (threshold >= dataLength || threshold <= 2) {
		console.log("LTTB: No downsampling needed; returning original data.");
		return data;
	}

	// Calculate min & max for the entire dataset, just for debugging
	const allReadings = data.map((row) => row.temp_sensor_reading);
	const minValue = Math.min(...allReadings);
	const maxValue = Math.max(...allReadings);
	console.log(
		`LTTB: Min reading in dataset = ${minValue}, Max reading in dataset = ${maxValue}`
	);

	// The buckets will exclude the first and last item from the bucketing
	// so that we always keep those two points
	const sampled: T[] = [];

	// Always include the first data point
	let a = 0;
	sampled.push(data[a]);

	// Bucket size
	const every = (dataLength - 2) / (threshold - 2);

	let maxArea: number;
	let nextA: number = 0;

	for (let i = 0; i < threshold - 2; i++) {
		// Calculate start and end of the current bucket
		const rangeStart = (Math.floor((i + 0) * every) + 1) | 0;
		const rangeEnd = (Math.floor((i + 1) * every) + 1) | 0;

		// The next bucket's end (used in area calculation)
		const rangeRight = Math.floor((i + 2) * every) + 1;

		// Make sure we don’t go out of bounds
		const rangeEndClamped = rangeEnd < dataLength ? rangeEnd : dataLength - 1;
		const rangeRightClamped =
			rangeRight < dataLength ? rangeRight : dataLength - 1;

		const pointA = data[a];
		maxArea = -1;

		// Within this bucket, find the point that forms the largest triangle
		// relative to pointA and the far-right point
		for (let j = rangeStart; j < rangeEndClamped; j++) {
			const area = triangleArea(
				// X1, Y1
				new Date(pointA.created_at).getTime(),
				pointA.temp_sensor_reading,
				// X2, Y2
				new Date(data[j].created_at).getTime(),
				data[j].temp_sensor_reading,
				// X3, Y3
				new Date(data[rangeRightClamped].created_at).getTime(),
				data[rangeRightClamped].temp_sensor_reading
			);
			if (area > maxArea) {
				maxArea = area;
				nextA = j;
			}
		}

		sampled.push(data[nextA]);
		a = nextA; // Next bucket's first point is this 'max area' point
	}

	// Always include the last data point
	sampled.push(data[dataLength - 1]);

	// Final debug log
	console.log(
		`LTTB: downsampled from ${dataLength} -> ${sampled.length} points.`
	);
	return sampled;
}

/**
 * triangleArea - Utility for computing the area of the triangle formed by 3 points (x1,y1), (x2,y2), (x3,y3).
 * The formula is: |x1(y2 - y3) + x2(y3 - y1) + x3(y1 - y2)| / 2
 */
function triangleArea(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	x3: number,
	y3: number
): number {
	return Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2;
}
