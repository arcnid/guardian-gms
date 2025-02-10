export const metricService = {
	/**
	 * Converts Celsius to Fahrenheit.
	 *
	 * @param celsius - The temperature in Celsius.
	 * @returns The converted temperature in Fahrenheit.
	 */
	getCtoF: (celsius: number): number => {
		return (celsius * 9) / 5 + 32;
	},

	/**
	 * Converts Fahrenheit to Celsius.
	 *
	 * @param fahrenheit - The temperature in Fahrenheit.
	 * @returns The converted temperature in Celsius.
	 */
	getFtoC: (fahrenheit: number): number => {
		return ((fahrenheit - 32) * 5) / 9;
	},
};
