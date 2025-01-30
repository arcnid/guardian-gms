// services/actions/service.js

import { getSupabaseClient } from "@/services/supabaseClient";
import * as Localization from "expo-localization";

/**
 * @typedef {Object} AutomationTrigger
 * @property {string} [schedule_type] - Type of schedule (e.g., 'weekly').
 * @property {string[]} [days_of_week] - Days of the week for the trigger.
 * @property {string} [common_time] - Common time for the trigger (e.g., '06:30').
 * @property {string} type - Type of trigger (e.g., 'scheduled', 'single_device').
 * @property {string|null} [condition] - Condition for the trigger (e.g., 'gt').
 * @property {string} [location_id] - Location ID associated with the trigger.
 * @property {string} [bin_id] - Bin ID associated with the trigger.
 * @property {string} [device_id] - Device ID associated with the trigger.
 * @property {string} [metric] - Metric to evaluate (e.g., 'temp').
 * @property {string} [conditionOperator] - Logical operator (e.g., 'and', 'or').
 * @property {string} [value] - Value to compare against.
 * @property {string} [secondaryConditionValue] - Secondary value for 'between' conditions.
 */

/**
 * @typedef {Object} AutomationAction
 * @property {string} type - Type of action (e.g., 'send_notification', 'turn_on_relay').
 * @property {string} [message] - Message for notification actions.
 * @property {string} [device_id] - Device ID for relay actions.
 */

/**
 * @typedef {Object} AutomationData
 * @property {string} [id] - UUID of the automation (optional for new automations).
 * @property {string} user_id - UUID of the user.
 * @property {'triggered' | 'scheduled'} type - Type of automation.
 * @property {string|null} [last_executed] - Timestamp of last execution.
 * @property {string|null} [last_result] - Result of last execution.
 * @property {AutomationTrigger[]} triggers - Array of triggers.
 * @property {AutomationAction[]} actions - Array of actions.
 * @property {string} [created_at] - Creation timestamp (optional, set by DB).
 * @property {string} [updated_at] - Last update timestamp (optional, set by DB).
 * @property {string} [timezone] - Timezone of the user (e.g., 'America/New_York').
 */

/**
 * @typedef {Object} UserAutomationRow
 * @property {string} id - UUID of the automation.
 * @property {string} user_id - UUID of the user.
 * @property {'triggered' | 'scheduled'} action_type - Type of automation.
 * @property {string|null} last_executed - Timestamp of last execution.
 * @property {string|null} last_result - Result of last execution.
 * @property {AutomationTrigger[]} triggers - Array of triggers.
 * @property {AutomationAction[]} actions - Array of actions.
 * @property {string} created_at - Creation timestamp.
 * @property {string} updated_at - Last update timestamp.
 * @property {string} timezone - Timezone of the user (e.g., 'America/New_York').
 */

/**
 * ActionService
 * Provides methods to interact with the `user_automations` table in Supabase.
 */
export const ActionService = {
	/**
	 * Fetch all automations for a specific user.
	 * @param {string} userId - UUID of the user.
	 * @returns {Promise<AutomationData[]>} - Array of AutomationData objects.
	 * @throws Will throw an error if the fetch operation fails.
	 */
	getActionsForUser: async (userId) => {
		const supabase = getSupabaseClient();
		const { data, error } = await supabase
			.from("user_automations")
			.select("*")
			.eq("user_id", userId);

		if (error) {
			console.error("Error fetching automations:", error);
			throw error;
		}

		console.log("Fetching actions from DB");

		/** @type {AutomationData[]} */
		const automations = data.map((item) => ({
			id: item.id,
			user_id: item.user_id,
			type: item.action_type,
			last_executed: item.last_executed,
			last_result: item.last_result,
			triggers: item.triggers,
			actions: item.actions,
			timezone: item.timezone, // Include timezone
			created_at: item.created_at,
			updated_at: item.updated_at,
		}));

		return automations;
	},

	/**
	 * Add a new automation.
	 * Automatically includes the user's timezone detected from the device.
	 * @param {AutomationData} actionData - AutomationData object to insert.
	 * @returns {Promise<string>} - UUID of the newly created automation.
	 * @throws Will throw an error if the insert operation fails or timezone is missing.
	 */
	addAction: async (actionData) => {
		const supabase = getSupabaseClient();

		// Automatically detect the user's timezone using expo-localization
		const timezone = Localization.timezone;

		// Validate that timezone is available
		if (!timezone) {
			console.error("Failed to detect user's timezone.");
			throw new Error(
				"Timezone detection failed. Please ensure your device settings allow timezone detection."
			);
		}

		// Prepare the automation data with timezone
		const automationPayload = {
			user_id: actionData.user_id,
			action_type: actionData.type,
			triggers: actionData.triggers,
			actions: actionData.actions,
			timezone: timezone, // Automatically include timezone
		};

		const { data, error } = await supabase
			.from("user_automations")
			.insert([automationPayload])
			.select("id"); // Select the id of the inserted row

		if (error) {
			console.error("Error adding automation:", error);
			throw error;
		}

		if (data && data.length > 0) {
			return data[0].id;
		}

		throw new Error("Failed to retrieve automation ID after insertion.");
	},

	/**
	 * Remove an automation by its ID.
	 * @param {string} actionId - UUID of the automation to remove.
	 * @returns {Promise<boolean>} - Boolean indicating success.
	 * @throws Will throw an error if the delete operation fails.
	 */
	removeAction: async (actionId) => {
		const supabase = getSupabaseClient();
		const { data, error } = await supabase
			.from("user_automations")
			.delete()
			.eq("id", actionId);

		if (error) {
			console.error("Error removing automation:", error);
			throw error;
		}

		return data && data.length > 0;
	},

	/**
	 * Update an existing automation.
	 * Automatically includes the user's timezone detected from the device if not provided.
	 * @param {string} automationId - UUID of the automation to update.
	 * @param {Partial<AutomationData>} updatedData - Partial AutomationData object with updated fields.
	 * @returns {Promise<boolean>} - Boolean indicating success.
	 * @throws Will throw an error if the update operation fails or timezone is missing.
	 */
	updateAction: async (automationId, updatedData) => {
		const supabase = getSupabaseClient();

		// Determine the timezone to use
		let timezone = updatedData.timezone;

		if (!timezone) {
			// Automatically detect the user's timezone using expo-localization
			timezone = Localization.timezone;

			// Validate that timezone is available
			if (!timezone) {
				console.error("Failed to detect user's timezone during update.");
				throw new Error(
					"Timezone detection failed. Please ensure your device settings allow timezone detection."
				);
			}
		}

		// Prepare the update payload
		const updatePayload = {
			action_type: updatedData.type || undefined,
			triggers: updatedData.triggers || undefined,
			actions: updatedData.actions || undefined,
			timezone: timezone, // Include the detected or provided timezone
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from("user_automations")
			.update(updatePayload)
			.eq("id", automationId);

		if (error) {
			console.error("Error updating automation:", error);
			throw error;
		}

		return data && data.length > 0;
	},
};
