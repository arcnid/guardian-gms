// app/(authenticated)/ScheduledActions.js

import React, { useEffect, useState, useContext, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	Alert,
	RefreshControl,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons"; // Removed FontAwesome as it's no longer used
import BackButton from "../../../../components/BackButton";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { ActionService } from "@/services/actions/service";
import { UserDeviceService } from "@/services/userDevice/service"; // Ensure correct path

// Icon and label mappings for triggers
const triggerTypeMap = {
	scheduled: {
		label: "Scheduled",
		icon: "schedule",
		color: "#4CAF50", // Green
	},
	single_device: {
		label: "Device Trigger",
		icon: "device-thermostat", // Icon for device/sensor
		color: "#FF9800", // Orange
	},
	two_device_diff: {
		label: "Comparison Trigger",
		icon: "compare-arrows", // Icon for comparison
		color: "#2196F3", // Blue
	},
	// Add more trigger types as needed
};

// Icon and label mappings for actions
const actionTypeMap = {
	send_notification: {
		label: "Send Notification",
		icon: "notifications",
		color: "#2196F3", // Blue
	},
	turn_on_relay: {
		label: "Turn On Relay",
		icon: "toggle-on",
		color: "#FF9800", // Orange
	},
	turn_off_relay: {
		label: "Turn Off Relay",
		icon: "toggle-off",
		color: "#9E9E9E", // Grey
	},
	// Add more action types as needed
};

const ScheduledActions = () => {
	const { userId } = useContext(AuthContext); // Get user ID from AuthContext
	const [scheduledActions, setScheduledActions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [deviceMap, setDeviceMap] = useState({}); // Mapping of deviceId to deviceName
	const router = useRouter();

	/**
	 * Fetches device names and returns a mapping of deviceId to deviceName.
	 */
	const fetchDeviceNames = useCallback(async (deviceIds) => {
		const map = {};
		try {
			const devicePromises = deviceIds.map((id) =>
				UserDeviceService.getDevice(id)
			);

			const devices = await Promise.all(devicePromises);

			console.log("Fetched devices:", devices);
			devices.forEach((device) => {
				if (device && device.device_id) {
					// Ensure device.device_name exists, else fallback to "Unknown Device"
					const deviceName = device.device_name || "Unknown Device";
					map[device.device_id] = deviceName; // Map using device.device_id
					console.log(
						`Mapped Device ID: ${device.device_id} to Name: ${deviceName}`
					);
				} else {
					console.log(
						`Device data missing or invalid for ID: ${device?.device_id}`
					);
				}
			});
		} catch (error) {
			console.error("Failed to fetch device names:", error);
			Alert.alert(
				"Error",
				"Unable to fetch device names. Some device names might be unavailable."
			);
		}
		return map;
	}, []);

	/**
	 * Fetches scheduled actions for the user along with device names.
	 */
	const fetchScheduledActions = useCallback(async () => {
		try {
			setLoading(true);
			const actions = await ActionService.getActionsForUser(userId);
			console.log("Fetched actions:", actions);

			if (!actions || actions.length === 0) {
				setScheduledActions([]);
				setDeviceMap({});
				console.log("No scheduled actions found.");
			} else {
				// Extract unique device IDs from triggers and actions
				const deviceIds = new Set();
				actions.forEach((action) => {
					// Extract device IDs from triggers
					action.triggers.forEach((trigger) => {
						if (trigger.device_id) deviceIds.add(trigger.device_id);
						if (trigger.device1?.device_id)
							deviceIds.add(trigger.device1.device_id);
						if (trigger.device2?.device_id)
							deviceIds.add(trigger.device2.device_id);
					});
					// Extract device IDs from actions
					action.actions.forEach((act) => {
						if (act.device_id) deviceIds.add(act.device_id);
					});
				});

				console.log(
					"Unique Device IDs extracted from triggers and actions:",
					Array.from(deviceIds)
				);

				// Fetch device names
				const deviceIdArray = Array.from(deviceIds);
				const fetchedDeviceMap = await fetchDeviceNames(deviceIdArray);
				console.log("Device Map after fetching:", fetchedDeviceMap);

				setDeviceMap(fetchedDeviceMap);

				// Set scheduled actions
				const validatedActions = actions.map((action) => ({
					id: action.id,
					triggers: action.triggers || [],
					actions: action.actions || [],
					created_at: action.created_at,
					updated_at: action.updated_at,
				}));
				setScheduledActions(validatedActions);
				console.log("Scheduled actions set:", validatedActions);
			}
		} catch (error) {
			console.error("Failed to fetch scheduled actions:", error);
			Alert.alert(
				"Error",
				"Unable to fetch scheduled actions. Please try again."
			);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [userId, fetchDeviceNames]);

	useEffect(() => {
		fetchScheduledActions();
	}, [fetchScheduledActions]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchScheduledActions();
	}, [fetchScheduledActions]);

	const handleRemoveScheduledAction = (actionId) => {
		Alert.alert(
			"Remove Scheduled Action",
			"Are you sure you want to remove this scheduled action?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: async () => {
						try {
							await ActionService.removeAction(actionId);
							setScheduledActions((prev) =>
								prev.filter((action) => action.id !== actionId)
							);
							Alert.alert("Success", "Scheduled action removed successfully.");
						} catch (error) {
							console.error("Failed to remove scheduled action:", error);
							Alert.alert(
								"Error",
								"Unable to remove scheduled action. Please try again."
							);
						}
					},
				},
			]
		);
	};

	const handleAddScheduledAction = () => {
		router.push("/settings/actions/addAction");
	};

	/**
	 * Helper function to convert textual conditions to mathematical symbols.
	 */
	const conditionToSymbol = (condition) => {
		switch (condition) {
			case "gt":
				return ">";
			case "lt":
				return "<";
			case "eq":
				return "==";
			case "neq":
				return "!=";
			case "gte":
				return ">=";
			case "lte":
				return "<=";
			default:
				return condition.toUpperCase();
		}
	};

	const operatorToSymbol = (operator) => {
		switch (operator) {
			case "and":
				return "AND";
			case "or":
				return "OR";
			default:
				return null;
		}
	};

	/**
	 * Helper function to create a verbose, mathematical expression from a trigger object.
	 * @param {Object} trigger - The trigger object.
	 * @param {number} index - The index of the trigger in the triggers array.
	 * @param {number} total - The total number of triggers.
	 * @returns {React.Node} - The verbose expression with operator if applicable.
	 */
	const createVerboseExpression = (trigger, index, total) => {
		switch (trigger.type) {
			case "scheduled":
				return (
					<Text style={styles.triggerDetails}>
						Every {trigger.days_of_week.join(", ")} at {trigger.common_time}
					</Text>
				);
			case "single_device":
				// Ensure fallback to "Unknown Device" if deviceName is not found
				const deviceName = deviceMap[trigger.device_id] || "Unknown Device";
				const conditionSymbol = conditionToSymbol(trigger.condition);

				// Determine if operator should be displayed
				const operatorText = operatorToSymbol(trigger.conditionOperator);

				console.log(`Trigger`, trigger);

				return (
					<View style={styles.expressionContainer}>
						{operatorText && (
							<View style={styles.operatorBadge}>
								<Text style={styles.operatorBadgeText}>{operatorText}</Text>
							</View>
						)}
						<Text style={styles.triggerDetails}>
							When: {deviceName} {trigger.metric} {conditionSymbol}{" "}
							{trigger.value}
						</Text>
					</View>
				);
			case "two_device_diff":
				const device1Name =
					deviceMap[trigger.device1?.device_id] || "Unknown Device"; // Updated
				const device2Name =
					deviceMap[trigger.device2?.device_id] || "Unknown Device"; // Updated
				const diffConditionSymbol = conditionToSymbol(trigger.condition);
				const diffOperatorText =
					trigger.conditionOperator && index < total - 1
						? operatorToSymbol(trigger.conditionOperator)
						: null;

				console.log(
					`Trigger ${index + 1}: ${device1Name} vs ${device2Name} - ${trigger.metric} difference ${diffConditionSymbol} ${trigger.value}${diffOperatorText ? " " + diffOperatorText : ""}`
				);

				return (
					<View style={styles.expressionContainer}>
						<Text style={styles.triggerDetails}>
							When: {device1Name} vs {device2Name} - {trigger.metric} difference{" "}
							{diffConditionSymbol} {trigger.value}
						</Text>
						{diffOperatorText && (
							<View style={styles.operatorBadge}>
								<Text style={styles.operatorBadgeText}>{diffOperatorText}</Text>
							</View>
						)}
					</View>
				);
			default:
				return <Text style={styles.triggerDetails}>Unknown trigger type</Text>;
		}
	};

	const renderScheduledActionItem = ({ item }) => {
		const totalTriggers = item.triggers.length;
		return (
			<View style={styles.card}>
				<View style={styles.cardContent}>
					{item.triggers.length > 0 ? (
						item.triggers.map((trigger, index) => (
							<View
								key={`${item.id}-trigger-${index}`}
								style={styles.triggerContainer}
							>
								<View style={styles.iconLabelContainer}>
									<MaterialIcons
										name={triggerTypeMap[trigger.type]?.icon || "event"}
										size={20}
										color={triggerTypeMap[trigger.type]?.color || "#000"}
									/>
									<Text style={styles.triggerLabel}>
										{triggerTypeMap[trigger.type]?.label || trigger.type}
									</Text>
								</View>
								{createVerboseExpression(trigger, index, totalTriggers)}
							</View>
						))
					) : (
						<Text style={styles.noDataText}>No triggers set.</Text>
					)}

					{/* Actions */}
					{item.actions.length > 0 ? (
						item.actions.map((action, index) => (
							<View
								key={`${item.id}-action-${index}`}
								style={styles.actionContainer}
							>
								<View style={styles.iconLabelContainer}>
									<MaterialIcons
										name={actionTypeMap[action.type]?.icon || "add-task"}
										size={20}
										color={actionTypeMap[action.type]?.color || "#000"}
									/>
									<Text style={styles.actionLabel}>
										{actionTypeMap[action.type]?.label || action.type}
									</Text>
								</View>
								{action.type === "send_notification" && (
									<Text style={styles.actionDetails}>
										Message: {action.message}
									</Text>
								)}
								{(action.type === "turn_on_relay" ||
									action.type === "turn_off_relay") && (
									<Text style={styles.actionDetails}>
										Relay: {deviceMap[action.device_id] || "Unknown Device"}{" "}
										turned {action.type === "turn_on_relay" ? "ON" : "OFF"}
									</Text>
								)}
							</View>
						))
					) : (
						<Text style={styles.noDataText}>No actions set.</Text>
					)}
				</View>
				<TouchableOpacity
					onPress={() => handleRemoveScheduledAction(item.id)}
					style={styles.deleteButton}
					accessibilityLabel={`Delete ${item.id}`}
				>
					<MaterialIcons name="delete" size={24} color="#FF5722" />
				</TouchableOpacity>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View>
					<BackButton label="Settings" />
				</View>
				<View style={styles.headerContainer}>
					<Text style={styles.heading}>Custom Actions</Text>
					<View style={{ width: 24 }} />
				</View>

				<TouchableOpacity
					style={styles.addButton}
					onPress={handleAddScheduledAction}
					accessibilityLabel="Add Scheduled Action"
				>
					<MaterialIcons name="add" size={24} color="#FFF" />
					<Text style={styles.addButtonText}>Add Custom Action</Text>
				</TouchableOpacity>

				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#71A12F" />
						<Text style={styles.loadingText}>Loading scheduled actions...</Text>
					</View>
				) : (
					<FlatList
						data={scheduledActions}
						keyExtractor={(item) => String(item.id)}
						renderItem={renderScheduledActionItem}
						contentContainerStyle={
							scheduledActions.length === 0 ? styles.emptyListContainer : null
						}
						ListEmptyComponent={
							<Text style={styles.noDataText}>
								No scheduled actions found. Start by adding one!
							</Text>
						}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
						}
					/>
				)}
			</View>
		</SafeAreaView>
	);
};

export default ScheduledActions;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	container: {
		flex: 1,
		padding: 16,
	},
	headerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
		justifyContent: "center",
		alignContent: "center",
		marginLeft: 15,
	},
	heading: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		textAlign: "center",
		flex: 1,
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#71A12F",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginBottom: 16,
		justifyContent: "center",
		shadowColor: "#71A12F",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.5,
		shadowRadius: 4,
		elevation: 3,
	},
	addButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	cardContent: {
		flex: 1,
		paddingRight: 8,
	},
	triggerContainer: {
		marginBottom: 12,
		padding: 8,
		backgroundColor: "#F0F0F0",
		borderRadius: 8,
	},
	actionContainer: {
		marginBottom: 8,
		padding: 8,
		backgroundColor: "#E8F5E9",
		borderRadius: 8,
	},
	iconLabelContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4,
	},
	triggerLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginLeft: 8,
	},
	actionLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginLeft: 8,
	},
	triggerDetails: {
		fontSize: 14,
		color: "#555",
	},
	actionDetails: {
		fontSize: 14,
		color: "#555",
	},
	deleteButton: {
		padding: 8,
		marginTop: 4,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 12,
		textAlign: "center",
		fontSize: 16,
		color: "#999",
	},
	noDataText: {
		textAlign: "center",
		fontSize: 16,
		color: "#999",
		marginTop: 32,
	},
	emptyListContainer: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	expressionContainer: {
		flexDirection: "column", // Stack vertically
		alignItems: "flex-start",
		flexWrap: "wrap",
	},
	operatorBadge: {
		backgroundColor: "#D1FAE5", // Light green background
		borderRadius: 12,
		paddingHorizontal: 8,
		paddingVertical: 4,
		alignSelf: "flex-start",
		marginTop: 4,
	},
	operatorBadgeText: {
		fontSize: 12,
		color: "#047857", // Dark green text
		fontWeight: "500",
	},
});
