// utils/generateFixedTimestamps.ts

import { DateTime } from "luxon";

/**
 * Generates a list of fixed timestamps based on the selected timeframe.
 *
 * @param timeframe - The selected timeframe ("1D", "1W", "1M", "1Y", "MAX").
 * @returns An array of ISO strings representing the expected timestamps.
 */
export function generateFixedTimestamps(timeframe: string): string[] {
	const now = DateTime.utc();
	let startDate: DateTime;
	let interval: "hours" | "days" | "months" = "days";
	let step: number;

	switch (timeframe) {
		case "1D":
			startDate = now.minus({ days: 1 });
			interval = "hours";
			step = 4; // Every 4 hours
			break;
		case "1W":
			startDate = now.minus({ weeks: 1 });
			interval = "days";
			step = 1; // Every day
			break;
		case "1M":
			startDate = now.minus({ months: 1 });
			interval = "days";
			step = 1; // Every day
			break;
		case "1Y":
			startDate = now.minus({ years: 1 });
			interval = "months";
			step = 1; // Every month
			break;
		case "MAX":
			// For MAX, we rely on actual data points
			return [];
		default:
			startDate = now.minus({ days: 1 });
			interval = "hours";
			step = 4;
			break;
	}

	const timestamps: string[] = [];
	let current = startDate;

	while (current <= now) {
		timestamps.push(current.toISO());
		current = current.plus(
			interval === "hours"
				? { hours: step }
				: interval === "days"
					? { days: step }
					: { months: step }
		);
	}

	return timestamps;
}
