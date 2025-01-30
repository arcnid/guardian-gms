// app/(authenticated)/AddAction.js

import React, { useState, useContext, useEffect, useMemo } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	TextInput,
	Alert,
	Platform,
	TouchableWithoutFeedback,
	Keyboard,
	ActivityIndicator,
	SafeAreaView,
	Modal,
} from "react-native";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "@/contexts/AuthContext";
import { ActionService } from "@/services/actions/service"; // Ensure correct import path
import BackButton from "@/components/BackButton";
import * as Progress from "react-native-progress";
import { Dropdown } from "react-native-element-dropdown";
import { locationService } from "@/services/locations/service";
import { LocationsList } from "@/components/locations/Locations";
import { UserDeviceService } from "@/services/userDevice/service";

// Import react-time-picker only for web
let TimePickerWeb = null;
if (Platform.OS === "web") {
	TimePickerWeb = require("react-time-picker").default;
}

const AddAction = () => {
	const { userId } = useContext(AuthContext);

	const [currentStep, setCurrentStep] = useState(1);
	const steps = [
		"Select Trigger Type",
		"Configure Trigger",
		"Configure Actions",
	];

	// **New States for Multiple Triggers**
	const [triggers, setTriggers] = useState([]); // Array of triggers
	const [isOperatorModalVisible, setIsOperatorModalVisible] = useState(false); // Modal to choose AND/OR
	const [pendingOperator, setPendingOperator] = useState(null); // Selected operator for the next trigger

	// State to track if editing a trigger
	const [editingTriggerIndex, setEditingTriggerIndex] = useState(null);

	// Current Trigger States
	const [actionType, setActionType] = useState(null);

	// **Step 2 (Scheduled) - Updated for Single Time Scheduling**
	const [selectedDays, setSelectedDays] = useState([]); // Array of selected days, e.g., ["Monday", "Wednesday"]
	const [commonTime, setCommonTime] = useState(""); // Single time for all selected days, e.g., "14:00"
	const [showTimePicker, setShowTimePicker] = useState(false); // Whether to show the time picker

	// Step 2 (Triggered Single-Device)
	const [selectedLocation, setSelectedLocation] = useState(null);
	const [selectedBin, setSelectedBin] = useState(null);
	const [selectedDevice, setSelectedDevice] = useState(null);

	const [selectedMetric, setSelectedMetric] = useState(null);
	const [selectedCondition, setSelectedCondition] = useState(null);
	const [conditionValue, setConditionValue] = useState("");
	const [secondaryConditionValue, setSecondaryConditionValue] = useState("");

	// Step 2 (Triggered Two-Device Comparison)
	const [selectedLocation1Comp, setSelectedLocation1Comp] = useState(null);
	const [selectedBin1Comp, setSelectedBin1Comp] = useState(null);
	const [selectedDevice1Comp, setSelectedDevice1Comp] = useState(null);
	const [deviceType1, setDeviceType1] = useState(null); // Track the device type of the first device

	const [selectedMetricComp, setSelectedMetricComp] = useState(null); // Single metric for both devices

	const [selectedLocation2Comp, setSelectedLocation2Comp] = useState(null);
	const [selectedBin2Comp, setSelectedBin2Comp] = useState(null);
	const [selectedDevice2Comp, setSelectedDevice2Comp] = useState(null);

	const [differenceCondition, setDifferenceCondition] = useState(null);
	const [differenceValue, setDifferenceValue] = useState("");
	const [differenceValue2, setDifferenceValue2] = useState("");

	// Step 3 -> Action config
	const [actions, setActions] = useState([]);
	const [actionDropdownFocus, setActionDropdownFocus] = useState({});

	// Location data
	const [locations, setLocations] = useState([]);
	const [locationsLoading, setLocationsLoading] = useState(true);
	const [locationsError, setLocationsError] = useState(null);

	// Metrics for single device triggers
	const [metricsSingle, setMetricsSingle] = useState([]);
	const [metricsSingleLoading, setMetricsSingleLoading] = useState(false);

	// Metrics for the two-device triggers
	const [metricsComp, setMetricsComp] = useState([]);
	const [metricsCompLoading, setMetricsCompLoading] = useState(false);

	const [isFocusTriggerType, setIsFocusTriggerType] = useState(false);

	/* ----------------------------------------------------------------
	 * Metric Icons Mapping
	 * ---------------------------------------------------------------- */
	const metricIcons = {
		temp: "thermostat",
		humidity: "opacity",
		powerState: "power",
	};

	/* ----------------------------------------------------------------
	 * Define Available Actions
	 * ---------------------------------------------------------------- */
	const availableActions = [
		{
			label: "Send Me a Notification",
			value: "send_notification",
			icon: "notifications",
			description: "Receive a notification when the trigger condition is met.",
		},
		{
			label: "Turn On a Relay Device",
			value: "turn_on_relay",
			icon: "power",
			description: "Automatically turn on a relay device.",
		},
		{
			label: "Turn Off a Relay Device",
			value: "turn_off_relay",
			icon: "power-off",
			description: "Automatically turn off a relay device.",
		},
		// Add more actions as needed
	];

	/* ----------------------------------------------------------------
	 * Fetch user locations on mount
	 * ---------------------------------------------------------------- */
	useEffect(() => {
		const fetchLocations = async () => {
			setLocationsLoading(true);
			try {
				const userLocations = await locationService.getLocationsForUser(userId);
				console.log("Fetched userLocations from API:", userLocations);
				setLocations(userLocations);
			} catch (error) {
				console.error("Failed to load locations:", error);
				setLocationsError("Failed to load locations");
				Alert.alert("Error", "Failed to load locations");
			} finally {
				setLocationsLoading(false);
			}
		};
		fetchLocations();
	}, [userId]);

	/* ----------------------------------------------------------------
	 * SINGLE DEVICE: fetch device details once selectedDevice changes
	 * ---------------------------------------------------------------- */
	useEffect(() => {
		if (!selectedDevice) {
			setMetricsSingle([]);
			return;
		}

		const fetchMetrics = async () => {
			setMetricsSingleLoading(true);
			try {
				const device = await UserDeviceService.getDevice(selectedDevice);
				if (device) {
					if (device.device_type === "sensor") {
						setMetricsSingle([
							{ label: "Temperature", value: "temp" },
							{ label: "Humidity", value: "humidity" },
						]);
					} else if (
						device.device_type === "relay" ||
						device.type === "relay"
					) {
						setMetricsSingle([{ label: "Power State", value: "powerState" }]);
					} else {
						setMetricsSingle([]);
					}
				} else {
					setMetricsSingle([]);
				}
			} catch (err) {
				console.log("Error fetching single device details:", err);
				setMetricsSingle([]);
			} finally {
				setMetricsSingleLoading(false);
			}
		};

		fetchMetrics();
	}, [selectedDevice]);

	/* ----------------------------------------------------------------
	 * TWO-DEVICE COMP: fetch device details for the first device
	 * ---------------------------------------------------------------- */
	useEffect(() => {
		if (!selectedDevice1Comp) {
			setMetricsComp([]);
			setDeviceType1(null);
			// Reset second device selections when first device is deselected
			setSelectedLocation2Comp(null);
			setSelectedBin2Comp(null);
			setSelectedDevice2Comp(null);
			setSelectedMetricComp(null);
		}

		const fetchMetrics = async () => {
			setMetricsCompLoading(true);
			try {
				const device = await UserDeviceService.getDevice(selectedDevice1Comp);
				if (device) {
					// Capture the device type
					setDeviceType1(device.device_type || null);

					if (device.device_type === "sensor") {
						setMetricsComp([
							{ label: "Temperature", value: "temp" },
							{ label: "Humidity", value: "humidity" },
						]);
					} else if (
						device.device_type === "relay" ||
						device.type === "relay"
					) {
						setMetricsComp([{ label: "Power State", value: "powerState" }]);
					} else {
						setMetricsComp([]);
					}

					// Reset second device selections to enforce same device_type and exclude Device 1
					setSelectedLocation2Comp(null);
					setSelectedBin2Comp(null);
					setSelectedDevice2Comp(null);
					setSelectedMetricComp(null);
				} else {
					setMetricsComp([]);
					setDeviceType1(null);
				}
			} catch (err) {
				console.log("Error fetching comp device1 details:", err);
				setMetricsComp([]);
				setDeviceType1(null);
			} finally {
				setMetricsCompLoading(false);
			}
		};

		fetchMetrics();
	}, [selectedDevice1Comp]);

	/* ----------------------------------------------------------------
	 * TWO-DEVICE COMP: fetch device details for the second device
	 * ---------------------------------------------------------------- */
	useEffect(() => {
		if (!selectedDevice2Comp) {
			setSelectedMetricComp(null);
			return;
		}

		const fetchDevice2 = async () => {
			setMetricsCompLoading(true);
			try {
				const device = await UserDeviceService.getDevice(selectedDevice2Comp);
				if (device) {
					if (deviceType1 && device.device_type !== deviceType1) {
						// If a different device type is selected, alert and reset
						Alert.alert(
							"Device Type Mismatch",
							`Device 2 must be the same type as Device 1 (${deviceType1}). Please select a matching device.`
						);
						setSelectedLocation2Comp(null);
						setSelectedBin2Comp(null);
						setSelectedDevice2Comp(null);
						setSelectedMetricComp(null);
						return;
					}

					// Since both devices share the same metric, no need to set metrics2Comp
					// Ensure that selectedMetricComp is still valid
					if (
						!metricsComp.some((metric) => metric.value === selectedMetricComp)
					) {
						setSelectedMetricComp(null);
					}
				} else {
					setSelectedMetricComp(null);
				}
			} catch (err) {
				console.log("Error fetching comp device2 details:", err);
				setSelectedMetricComp(null);
			} finally {
				setMetricsCompLoading(false);
			}
		};

		fetchDevice2();
	}, [selectedDevice2Comp, deviceType1, metricsComp]);

	const filteredLocationsForDevice2 = useMemo(() => {
		if (!deviceType1 || !locations) return locations;
		// Only include devices matching deviceType1 and exclude Device 1
		return locations.map((loc) => {
			const filteredBins = loc.bins.map((bin) => {
				const filteredDevices = bin.devices.filter(
					(d) => d.type === deviceType1 && d.id !== selectedDevice1Comp
				);
				return { ...bin, devices: filteredDevices };
			});
			return { ...loc, bins: filteredBins };
		});
	}, [deviceType1, selectedDevice1Comp, locations]);

	/* ----------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------- */
	// Return condition options for single device metric
	const getConditionOptions = (metric) => {
		if (metric === "powerState") {
			return [
				{ label: "Is On", value: "eq", icon: "power" },
				{ label: "Is Off", value: "ne", icon: "power-off" },
			];
		}
		return [
			{ label: "Above", value: "gt", icon: "arrow-upward" },
			{ label: "Below", value: "lt", icon: "arrow-downward" },
			{ label: "Between", value: "between", icon: "swap-horiz" },
		];
	};

	// Return condition options for difference triggers
	const getDifferenceConditionOptions = () => {
		return [
			{ label: "Difference Above", value: "gt", icon: "arrow-upward" },
			{ label: "Difference Below", value: "lt", icon: "arrow-downward" },
			{ label: "Difference Between", value: "between", icon: "swap-horiz" },
		];
	};

	// Build data structure for step 3 device grouping
	const getGroupedDevicesData = (locData) => {
		if (!Array.isArray(locData)) return [];
		return locData.map((loc) => ({
			label: loc.label,
			value: loc.value,
			children: loc.bins.flatMap((bin) =>
				bin.devices.map((dev) => ({
					label: `${bin.label} - ${dev.label}`,
					value: dev.value,
				}))
			),
		}));
	};

	// Helper function to get device type based on device ID
	const getDeviceType = (deviceId) => {
		const device = locations
			.flatMap((loc) => loc.bins)
			.flatMap((bin) => bin.devices)
			.find((d) => d.value === deviceId);
		return device ? device.device_type : null;
	};

	/* ----------------------------------------------------------------
	 * Step Navigation
	 * ---------------------------------------------------------------- */
	const handleNextStep = () => {
		// Step 1 validation
		if (currentStep === 1 && !actionType) {
			Alert.alert("Selection Required", "Please select a trigger type");
			return;
		}

		// Step 2 validation
		if (currentStep === 2) {
			// 2a) SCHEDULED - Updated for Single Time Scheduling
			if (actionType === "scheduled") {
				if (selectedDays.length === 0) {
					Alert.alert(
						"Configuration Required",
						"Please select at least one day for the schedule"
					);
					return;
				}

				if (!commonTime) {
					Alert.alert(
						"Configuration Required",
						"Please select a common time for all selected days"
					);
					return;
				}
			}
			// 2b) TRIGGERED (Single Device)
			else if (actionType === "triggeredSingle") {
				if (
					!selectedLocation ||
					!selectedBin ||
					!selectedDevice ||
					!selectedMetric ||
					!selectedCondition
				) {
					Alert.alert(
						"Configuration Required",
						"Please complete single device trigger configuration"
					);
					return;
				}
				if (selectedMetric !== "powerState") {
					if (selectedCondition === "between") {
						if (!conditionValue || !secondaryConditionValue) {
							Alert.alert(
								"Configuration Required",
								"Please enter both min and max values"
							);
							return;
						}
					} else if (
						!conditionValue &&
						selectedCondition !== "eq" &&
						selectedCondition !== "ne"
					) {
						Alert.alert("Configuration Required", "Please enter a value");
						return;
					}
				}
			}
			// 2c) TRIGGERED (Two-Device Comparison)
			else if (actionType === "triggeredComparison") {
				if (
					!selectedLocation1Comp ||
					!selectedBin1Comp ||
					!selectedDevice1Comp ||
					!selectedMetricComp ||
					!selectedLocation2Comp ||
					!selectedBin2Comp ||
					!selectedDevice2Comp ||
					!differenceCondition
				) {
					Alert.alert(
						"Configuration Required",
						"Please complete both devices' configuration"
					);
					return;
				}
				if (selectedMetricComp !== "powerState") {
					if (differenceCondition === "between") {
						if (!differenceValue || !differenceValue2) {
							Alert.alert(
								"Configuration Required",
								"Please enter both min and max difference"
							);
							return;
						}
					} else if (!differenceValue) {
						Alert.alert(
							"Configuration Required",
							"Please enter a difference value"
						);
						return;
					}
				}
			}

			// After validation, construct the current trigger
			let trigger = {};

			if (actionType === "scheduled") {
				// SCHEDULED - Single Time Scheduling
				trigger = {
					schedule_type: "weekly",
					days_of_week: selectedDays, // e.g., ["Monday", "Wednesday"]
					common_time: commonTime, // e.g., "14:00"
					type: "scheduled",
					condition: triggers.length === 0 ? null : pendingOperator, // Set condition
				};
			} else if (actionType === "triggeredSingle") {
				// SINGLE DEVICE
				if (selectedMetric === "powerState") {
					trigger = {
						type: "single_device",
						location_id: selectedLocation,
						bin_id: selectedBin,
						device_id: selectedDevice,
						metric: selectedMetric,
						condition: selectedCondition,
						value: selectedCondition === "eq" ? true : false,
						conditionOperator: triggers.length === 0 ? null : pendingOperator, // Set condition
					};
				} else {
					trigger = {
						type: "single_device",
						location_id: selectedLocation,
						bin_id: selectedBin,
						device_id: selectedDevice,
						metric: selectedMetric,
						condition: selectedCondition,
						value:
							selectedCondition === "between"
								? [conditionValue, secondaryConditionValue]
								: conditionValue,
						conditionOperator: triggers.length === 0 ? null : pendingOperator, // Set condition
					};
				}
			} else if (actionType === "triggeredComparison") {
				// TWO DEVICE
				if (selectedMetricComp === "powerState") {
					trigger = {
						type: "two_device_diff",
						metric: selectedMetricComp, // Single metric applied to both devices
						device1: {
							location_id: selectedLocation1Comp,
							bin_id: selectedBin1Comp,
							device_id: selectedDevice1Comp,
						},
						device2: {
							location_id: selectedLocation2Comp,
							bin_id: selectedBin2Comp,
							device_id: selectedDevice2Comp,
						},
						condition: differenceCondition,
						value: differenceCondition === "eq" ? true : false,
						conditionOperator: triggers.length === 0 ? null : pendingOperator, // Set condition
					};
				} else {
					trigger = {
						type: "two_device_diff",
						metric: selectedMetricComp, // Single metric applied to both devices
						device1: {
							location_id: selectedLocation1Comp,
							bin_id: selectedBin1Comp,
							device_id: selectedDevice1Comp,
						},
						device2: {
							location_id: selectedLocation2Comp,
							bin_id: selectedBin2Comp,
							device_id: selectedDevice2Comp,
						},
						condition: differenceCondition,
						value:
							differenceCondition === "between"
								? [differenceValue, differenceValue2]
								: differenceValue,
						conditionOperator: triggers.length === 0 ? null : pendingOperator, // Set condition
					};
				}
			}

			if (editingTriggerIndex !== null) {
				// **Update the existing trigger**
				setTriggers((prevTriggers) => {
					const updatedTriggers = [...prevTriggers];
					updatedTriggers[editingTriggerIndex] = trigger;
					return updatedTriggers;
				});
				setEditingTriggerIndex(null);
				setCurrentStep(3);
			} else {
				// **Add the constructed trigger to the triggers array**
				setTriggers((prevTriggers) => [...prevTriggers, trigger]);

				// **Reset trigger configuration states for the next trigger**
				resetTriggerConfig();

				// **Show modal to choose adding another trigger or proceed to actions**
				if (triggers.length > 0) {
					// If there's already at least one trigger, prompt for logical operator
					setIsOperatorModalVisible(true);
				} else {
					// If it's the first trigger, proceed to step3
					setCurrentStep(3);
				}
			}
		}

		// Step 3 validation
		if (currentStep === 3 && actions.length === 0) {
			Alert.alert("Configuration Required", "Please add at least one action");
			return;
		}

		if (currentStep === 3 && actions.length > 0) {
			// Final Submission will be handled separately
			return;
		}

		setCurrentStep((prev) => Math.min(prev + 1, steps.length));
	};

	/* ----------------------------------------------------------------
	 * Handle Logical Operator Selection
	 * ---------------------------------------------------------------- */
	const handleOperatorSelection = (operator) => {
		setPendingOperator(operator);
		setIsOperatorModalVisible(false);
		// Restart the wizard for the next trigger
		setCurrentStep(1);
	};

	/* ----------------------------------------------------------------
	 * Reset Trigger Configuration (After Adding a Trigger)
	 * ---------------------------------------------------------------- */
	const resetTriggerConfig = () => {
		setActionType(null);

		// Added these for single time scheduling
		setSelectedDays([]);
		setCommonTime("");
		setShowTimePicker(false);

		// Single device
		setSelectedLocation(null);
		setSelectedBin(null);
		setSelectedDevice(null);
		setSelectedMetric(null);
		setSelectedCondition(null);
		setConditionValue("");
		setSecondaryConditionValue("");
		setMetricsSingle([]);
		setMetricsSingleLoading(false);

		// Two device
		setSelectedLocation1Comp(null);
		setSelectedBin1Comp(null);
		setSelectedDevice1Comp(null);
		setDeviceType1(null);
		setSelectedMetricComp(null);

		setSelectedLocation2Comp(null);
		setSelectedBin2Comp(null);
		setSelectedDevice2Comp(null);
		setDifferenceCondition(null);
		setDifferenceValue("");
		setDifferenceValue2("");

		setMetricsComp([]);
		setMetricsCompLoading(false);
	};

	const handlePreviousStep = () => {
		// If on step 3 and there are multiple triggers, go back to the last trigger
		if (currentStep === 3 && triggers.length > 1) {
			// Remove the last trigger
			setTriggers((prevTriggers) => prevTriggers.slice(0, -1));
			// Set operator as null since it's removed
			setPendingOperator(null);
			// Set wizard to step2 to edit the last trigger
			setCurrentStep(2);
		} else {
			setCurrentStep((prev) => Math.max(prev - 1, 1));
		}
	};

	/* ----------------------------------------------------------------
	 * Step 3 -> Action config
	 * ---------------------------------------------------------------- */
	const [isActionModalVisible, setIsActionModalVisible] = useState(false);

	const handleAddAction = () => {
		setIsActionModalVisible(true);
	};

	const handleRemoveAction = (index) => {
		const updated = actions.filter((_, idx) => idx !== index);
		setActions(updated);

		const focusCopy = { ...actionDropdownFocus };
		delete focusCopy[index];
		setActionDropdownFocus(focusCopy);
	};

	const handleSelectActionType = (actionValue) => {
		setActions((prev) => [
			...prev,
			{
				id: Date.now(), // Unique identifier
				action_type: actionValue,
				location_id: null,
				bin_id: null,
				device_id: null,
				notification_message: "", // For send_notification
			},
		]);
		setActionDropdownFocus((prev) => ({
			...prev,
			[actions.length]: {
				location: false,
				bin: false,
				device: false,
				actionType: false,
			},
		}));
		setIsActionModalVisible(false);
	};

	const handleUpdateAction = (index, field, value) => {
		const updated = actions.map((action, idx) => {
			if (idx === index) return { ...action, [field]: value };
			return action;
		});
		setActions(updated);

		// Reset dependent fields
		if (field === "location_id") {
			handleUpdateAction(index, "bin_id", null);
			handleUpdateAction(index, "device_id", null);
		}
		if (field === "bin_id") {
			handleUpdateAction(index, "device_id", null);
		}
	};

	/* ----------------------------------------------------------------
	 * Final Submit for Actions Configuration
	 * ---------------------------------------------------------------- */
	const handleFinalSubmit = async () => {
		// Final validation to ensure both devices match
		if (triggers.some((trigger) => trigger.type === "two_device_diff")) {
			for (let i = 0; i < triggers.length; i++) {
				const trigger = triggers[i];
				if (trigger.type === "two_device_diff") {
					const deviceType2 = getDeviceType(trigger.device2.device_id);
					if (deviceType1 !== deviceType2) {
						Alert.alert(
							"Validation Error",
							"Device 2 must be the same type as Device 1."
						);
						return;
					}
				}
			}
		}

		try {
			// Process actions
			const processedActions = actions.map((action) => {
				switch (action.action_type) {
					case "send_notification":
						return {
							type: "send_notification",
							message: action.notification_message,
						};
					case "turn_on_relay":
						return {
							type: "turn_on_relay",
							device_id: action.device_id,
						};
					case "turn_off_relay":
						return {
							type: "turn_off_relay",
							device_id: action.device_id,
						};
					// Add more cases as needed
					default:
						return {};
				}
			});

			// Combine triggers with their conditions
			const combinedTriggers = triggers.map((trigger, index) => {
				const { conditionOperator, ...rest } = trigger;
				return {
					...rest,
					conditionOperator: index === 0 ? null : trigger.conditionOperator,
				};
			});

			const newAction = {
				user_id: userId,
				type: "triggered", // or "scheduled" based on your logic
				triggers: combinedTriggers, // Ensure it's 'triggers' if backend expects
				actions: processedActions,
			};
			console.log("Submitting new action:", newAction);

			const insertResult = await ActionService.addAction(newAction);
			console.log("Insert Result:", insertResult);

			Alert.alert("Success", "Action created successfully!");
			resetForm();
		} catch (error) {
			console.error("Failed to create action:", error);
			Alert.alert("Error", "Failed to create action. Please try again.");
		}
	};

	/** Reset everything */
	const resetForm = () => {
		setCurrentStep(1);
		setActionType(null);

		// Added these for single time scheduling
		setSelectedDays([]);
		setCommonTime("");
		setShowTimePicker(false);

		// Single device
		setSelectedLocation(null);
		setSelectedBin(null);
		setSelectedDevice(null);
		setSelectedMetric(null);
		setSelectedCondition(null);
		setConditionValue("");
		setSecondaryConditionValue("");
		setMetricsSingle([]);
		setMetricsSingleLoading(false);

		// Two device
		setSelectedLocation1Comp(null);
		setSelectedBin1Comp(null);
		setSelectedDevice1Comp(null);
		setDeviceType1(null);
		setSelectedMetricComp(null);

		setSelectedLocation2Comp(null);
		setSelectedBin2Comp(null);
		setSelectedDevice2Comp(null);
		setDifferenceCondition(null);
		setDifferenceValue("");
		setDifferenceValue2("");

		setMetricsComp([]);
		setMetricsCompLoading(false);

		setActions([]);
		setActionDropdownFocus({});
		setTriggers([]);
		setIsOperatorModalVisible(false);
		setPendingOperator(null);
		setEditingTriggerIndex(null);
	};

	/* ----------------------------------------------------------------
	 * Handle Editing a Trigger
	 * ---------------------------------------------------------------- */
	const handleEditTrigger = (index) => {
		const trigger = triggers[index];
		setEditingTriggerIndex(index);

		// Set actionType and other fields based on trigger.type
		if (trigger.type === "scheduled") {
			setActionType("scheduled");
			// Updated for single time scheduling
			setSelectedDays(trigger.days_of_week || []);
			setCommonTime(trigger.common_time || "");
		} else if (trigger.type === "single_device") {
			setActionType("triggeredSingle");
			setSelectedLocation(trigger.location_id);
			setSelectedBin(trigger.bin_id);
			setSelectedDevice(trigger.device_id);
			setSelectedMetric(trigger.metric);
			setSelectedCondition(trigger.condition);
			if (trigger.metric !== "powerState") {
				if (trigger.condition === "between") {
					setConditionValue(trigger.value[0]);
					setSecondaryConditionValue(trigger.value[1]);
				} else {
					setConditionValue(trigger.value);
				}
			}
		} else if (trigger.type === "two_device_diff") {
			setActionType("triggeredComparison");
			setSelectedLocation1Comp(trigger.device1.location_id);
			setSelectedBin1Comp(trigger.device1.bin_id);
			setSelectedDevice1Comp(trigger.device1.device_id);
			setSelectedMetricComp(trigger.metric);
			setSelectedLocation2Comp(trigger.device2.location_id);
			setSelectedBin2Comp(trigger.device2.bin_id);
			setSelectedDevice2Comp(trigger.device2.device_id);
			setDifferenceCondition(trigger.condition);
			if (trigger.metric !== "powerState") {
				if (trigger.condition === "between") {
					setDifferenceValue(trigger.value[0]);
					setDifferenceValue2(trigger.value[1]);
				} else {
					setDifferenceValue(trigger.value);
				}
			}
		}

		// Navigate to step 2
		setCurrentStep(2);
	};

	/* ----------------------------------------------------------------
	 * Handle Removing a Trigger
	 * ---------------------------------------------------------------- */
	const handleRemoveTrigger = (index) => {
		Alert.alert(
			"Confirm Removal",
			"Are you sure you want to remove this trigger?",
			[
				{
					text: "Cancel",
					style: "cancel",
				},
				{
					text: "Remove",
					style: "destructive",
					onPress: () => {
						setTriggers((prevTriggers) =>
							prevTriggers.filter((_, idx) => idx !== index)
						);
					},
				},
			]
		);
	};

	/* ----------------------------------------------------------------
	 * Rendering: Step 1
	 * ---------------------------------------------------------------- */
	const renderStep1 = () => (
		<View style={styles.stepContainer}>
			<Text style={styles.stepTitle}>Select Trigger Type</Text>

			{/* Scheduled Trigger */}
			<TouchableOpacity
				style={[
					styles.triggerCard,
					actionType === "scheduled" && styles.selectedCard,
				]}
				onPress={() => setActionType("scheduled")}
			>
				<MaterialIcons name="schedule" size={32} color="#71A12F" />
				<View style={styles.triggerTextContainer}>
					<Text style={styles.triggerTitle}>Scheduled Trigger</Text>
					<Text style={styles.triggerDescription}>
						Run actions at specific times
					</Text>
				</View>
			</TouchableOpacity>

			{/* Single Device Trigger */}
			<TouchableOpacity
				style={[
					styles.triggerCard,
					actionType === "triggeredSingle" && styles.selectedCard,
				]}
				onPress={() => setActionType("triggeredSingle")}
			>
				<MaterialIcons name="sensors" size={32} color="#71A12F" />
				<View style={styles.triggerTextContainer}>
					<Text style={styles.triggerTitle}>Single-Device Trigger</Text>
					<Text style={styles.triggerDescription}>
						Run actions based on device values
					</Text>
				</View>
			</TouchableOpacity>

			{/* Two Device Comparison Trigger */}
			<TouchableOpacity
				style={[
					styles.triggerCard,
					actionType === "triggeredComparison" && styles.selectedCard,
				]}
				onPress={() => setActionType("triggeredComparison")}
			>
				<MaterialIcons name="compare-arrows" size={32} color="#71A12F" />
				<View style={styles.triggerTextContainer}>
					<Text style={styles.triggerTitle}>Comparison Trigger</Text>
					<Text style={styles.triggerDescription}>
						Compare two devices’ values
					</Text>
				</View>
			</TouchableOpacity>
		</View>
	);

	/* ----------------------------------------------------------------
	 * Rendering: Step 2 (Scheduled) - Updated for Single Time Scheduling
	 * ---------------------------------------------------------------- */
	const renderStep2Scheduled = () => (
		<View style={styles.stepContainer}>
			<Text style={styles.stepTitle}>Schedule Configuration</Text>

			{/* Days of the Week Selection */}
			<Text style={styles.label}>Select Days of the Week</Text>
			<View style={styles.daysContainer}>
				{[
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
					"Sunday",
				].map((day) => {
					const isSelected = selectedDays.includes(day);
					return (
						<TouchableOpacity
							key={day}
							style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
							onPress={() => {
								if (isSelected) {
									// Deselect the day
									setSelectedDays(selectedDays.filter((d) => d !== day));
								} else {
									// Select the day
									setSelectedDays([...selectedDays, day]);
								}
							}}
						>
							<Text
								style={[
									styles.dayButtonText,
									isSelected && styles.dayButtonTextSelected,
								]}
							>
								{day.substring(0, 3)}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>

			{/* Common Time Selection */}
			{selectedDays.length > 0 && (
				<View style={styles.timePickerContainer}>
					<Text style={styles.label}>
						Set Common Time for All Selected Days
					</Text>
					{Platform.OS === "web" ? (
						<View style={styles.webTimePickerContainer}>
							<MaterialIcons name="access-time" size={24} color="#71A12F" />
							{/* Integrate react-time-picker with custom className */}
							<TimePickerWeb
								onChange={(time) => setCommonTime(time)}
								value={commonTime}
								format="HH:mm"
								className="time-picker"
								clearIcon={null}
								clockIcon={null}
								disableClock={true}
								// Optional: Add any additional props as needed
							/>
						</View>
					) : (
						<TouchableOpacity
							style={styles.timePickerButton}
							onPress={() => setShowTimePicker(true)}
						>
							<MaterialIcons name="access-time" size={24} color="#71A12F" />
							<Text style={styles.timePickerText}>
								{commonTime || "Select Time"}
							</Text>
						</TouchableOpacity>
					)}
				</View>
			)}

			{/* Time Picker Modal for Mobile */}
			{showTimePicker && Platform.OS !== "web" && (
				<DateTimePicker
					value={
						commonTime ? new Date(`1970-01-01T${commonTime}:00`) : new Date()
					}
					mode="time"
					display="default"
					onChange={(event, selectedTime) => {
						if (event.type === "dismissed") {
							setShowTimePicker(false);
							return;
						}
						setShowTimePicker(Platform.OS === "ios");
						if (selectedTime) {
							const hours = selectedTime.getHours().toString().padStart(2, "0");
							const minutes = selectedTime
								.getMinutes()
								.toString()
								.padStart(2, "0");
							const timeString = `${hours}:${minutes}`;
							setCommonTime(timeString);
						}
					}}
					is24Hour={true} // Ensures 24-hour format for consistency
				/>
			)}
		</View>
	);

	/* ----------------------------------------------------------------
	 * Rendering: Step 2 (Triggered Single Device)
	 * ---------------------------------------------------------------- */
	const renderStep2TriggeredSingleDevice = () => {
		return (
			<View style={styles.stepContainer}>
				<Text style={styles.stepTitle}>Configure Single-Device Trigger</Text>

				{locationsLoading ? (
					<ActivityIndicator size="large" color="#71A12F" />
				) : locationsError ? (
					<View>
						<Text style={styles.errorText}>{locationsError}</Text>
						<TouchableOpacity
							onPress={() => {
								/* Retry Logic */
								setLocationsError(null);
								setLocationsLoading(true);
								locationService
									.getLocationsForUser(userId)
									.then((userLocations) => {
										console.log(
											"Fetched userLocations from API:",
											userLocations
										);
										setLocations(userLocations);
									})
									.catch((error) => {
										console.error("Failed to load locations:", error);
										setLocationsError("Failed to load locations");
										Alert.alert("Error", "Failed to load locations");
									})
									.finally(() => {
										setLocationsLoading(false);
									});
							}}
						>
							<Text style={styles.retryText}>Tap to Retry</Text>
						</TouchableOpacity>
					</View>
				) : locations.length === 0 ? (
					<Text style={styles.infoText}>
						You have no locations. Please add locations first.
					</Text>
				) : (
					<LocationsList
						data={locations}
						selectedDevice={selectedDevice}
						onDeviceSelect={(locId, binId, devId) => {
							setSelectedLocation(locId);
							setSelectedBin(binId);
							setSelectedDevice(devId);
							setSelectedMetric(null);
							setSelectedCondition(null);
							setConditionValue("");
							setSecondaryConditionValue("");
						}}
						selectable={true}
					/>
				)}

				{selectedDevice && (
					<ScrollView>
						<Text style={styles.label}>Select Metric</Text>

						{metricsSingleLoading ? (
							<ActivityIndicator size="large" color="#71A12F" />
						) : (
							<View style={styles.badgeContainer}>
								{metricsSingle.map((metricOption) => {
									const isActive = selectedMetric === metricOption.value;
									return (
										<TouchableOpacity
											key={metricOption.value}
											style={[styles.badge, isActive && styles.badgeActive]}
											onPress={() => {
												setSelectedMetric(metricOption.value);
												setSelectedCondition(null);
												setConditionValue("");
												setSecondaryConditionValue("");
											}}
										>
											<MaterialIcons
												name={metricIcons[metricOption.value] || "device-hub"}
												size={24}
												color="#71A12F"
											/>
											<Text
												style={[
													styles.badgeText,
													isActive && styles.badgeTextActive,
												]}
											>
												{metricOption.label}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						)}

						{selectedMetric && (
							<ScrollView>
								<Text style={styles.label}>Condition</Text>
								<ConditionBadge
									options={getConditionOptions(selectedMetric)}
									selectedValue={selectedCondition}
									onSelect={(value) => {
										setSelectedCondition(value);
										setConditionValue("");
										setSecondaryConditionValue("");
									}}
								/>
							</ScrollView>
						)}

						{selectedCondition && selectedMetric !== "powerState" && (
							<>
								<Text style={styles.label}>
									{selectedCondition === "between"
										? "Minimum Value"
										: "Target Value"}
								</Text>
								<TextInput
									style={[
										styles.input,
										Platform.OS === "web" && styles.webInput,
									]} // Added platform-specific styling
									keyboardType="numeric"
									value={conditionValue}
									onChangeText={setConditionValue}
									placeholder={
										selectedCondition === "between"
											? "Enter Minimum Value"
											: "Enter Value"
									}
									autoCapitalize="none"
									placeholderTextColor="#888"
								/>

								{selectedCondition === "between" && (
									<>
										<Text style={styles.label}>Maximum Value</Text>
										<TextInput
											style={[
												styles.input,
												Platform.OS === "web" && styles.webInput,
											]} // Added platform-specific styling
											keyboardType="numeric"
											value={secondaryConditionValue}
											onChangeText={setSecondaryConditionValue}
											placeholder="Enter Maximum Value"
											autoCapitalize="none"
											placeholderTextColor="#888"
										/>
									</>
								)}
							</>
						)}
					</ScrollView>
				)}
			</View>
		);
	};

	/* ----------------------------------------------------------------
	 * Rendering: Step 2 (Triggered Two-Device Comparison)
	 * ---------------------------------------------------------------- */
	const renderStep2TriggeredComparison = () => {
		return (
			<View style={styles.stepContainer}>
				<Text style={styles.stepTitle}>Configure Two-Device Comparison</Text>

				<ScrollView contentContainerStyle={styles.stepContainerScroll}>
					{/* Device 1 */}
					<Text style={styles.subSectionTitle}>Device 1</Text>
					{locationsLoading ? (
						<ActivityIndicator size="large" color="#71A12F" />
					) : locationsError ? (
						<View>
							<Text style={styles.errorText}>{locationsError}</Text>
							<TouchableOpacity
								onPress={() => {
									/* Retry Logic */
									setLocationsError(null);
									setLocationsLoading(true);
									locationService
										.getLocationsForUser(userId)
										.then((userLocations) => {
											console.log(
												"Fetched userLocations from API:",
												userLocations
											);
											setLocations(userLocations);
										})
										.catch((error) => {
											console.error("Failed to load locations:", error);
											setLocationsError("Failed to load locations");
											Alert.alert("Error", "Failed to load locations");
										})
										.finally(() => {
											setLocationsLoading(false);
										});
								}}
							>
								<Text style={styles.retryText}>Tap to Retry</Text>
							</TouchableOpacity>
						</View>
					) : locations.length === 0 ? (
						<Text style={styles.infoText}>
							You have no locations. Please add locations first.
						</Text>
					) : (
						<LocationsList
							data={locations}
							selectedDevice={selectedDevice1Comp}
							onDeviceSelect={(locId, binId, devId) => {
								setSelectedLocation1Comp(locId);
								setSelectedBin1Comp(binId);
								setSelectedDevice1Comp(devId);
								setSelectedMetricComp(null);
							}}
							selectable={true}
						/>
					)}

					{/* Device 2 */}
					<Text style={styles.subSectionTitle}>Device 2</Text>
					{locationsLoading ? (
						<ActivityIndicator size="large" color="#71A12F" />
					) : locationsError ? (
						<View>
							<Text style={styles.errorText}>{locationsError}</Text>
							<TouchableOpacity
								onPress={() => {
									/* Retry Logic */
									setLocationsError(null);
									setLocationsLoading(true);
									locationService
										.getLocationsForUser(userId)
										.then((userLocations) => {
											console.log(
												"Fetched userLocations from API:",
												userLocations
											);
											setLocations(userLocations);
										})
										.catch((error) => {
											console.error("Failed to load locations:", error);
											setLocationsError("Failed to load locations");
											Alert.alert("Error", "Failed to load locations");
										})
										.finally(() => {
											setLocationsLoading(false);
										});
								}}
							>
								<Text style={styles.retryText}>Tap to Retry</Text>
							</TouchableOpacity>
						</View>
					) : locations.length === 0 ? (
						<Text style={styles.infoText}>
							You have no locations. Please add locations first.
						</Text>
					) : deviceType1 ? (
						<LocationsList
							data={filteredLocationsForDevice2}
							selectedDevice={selectedDevice2Comp}
							onDeviceSelect={(locId, binId, devId) => {
								setSelectedLocation2Comp(locId);
								setSelectedBin2Comp(binId);
								setSelectedDevice2Comp(devId);
							}}
							selectable={true}
						/>
					) : (
						<Text style={styles.infoText}>
							Select Device 1 first to choose Device 2
						</Text>
					)}

					{selectedDevice2Comp && (
						<>
							<Text style={styles.label}>Select Metric</Text>
							{metricsCompLoading ? (
								<ActivityIndicator size="large" color="#71A12F" />
							) : (
								<View style={styles.badgeContainer}>
									{metricsComp.map((metricOption) => {
										const isActive = selectedMetricComp === metricOption.value;
										return (
											<TouchableOpacity
												key={metricOption.value}
												style={[styles.badge, isActive && styles.badgeActive]}
												onPress={() => {
													setSelectedMetricComp(metricOption.value);
												}}
											>
												<MaterialIcons
													name={metricIcons[metricOption.value] || "device-hub"}
													size={24}
													color="#71A12F"
												/>
												<Text
													style={[
														styles.badgeText,
														isActive && styles.badgeTextActive,
													]}
												>
													{metricOption.label}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							)}

							{/* Single Metric for Both Devices */}
							{selectedMetricComp && (
								<>
									<Text style={styles.label}>Difference Condition</Text>
									<ConditionBadge
										options={getDifferenceConditionOptions()}
										selectedValue={differenceCondition}
										onSelect={(value) => {
											setDifferenceCondition(value);
											setDifferenceValue("");
											setDifferenceValue2("");
										}}
									/>

									{differenceCondition &&
										selectedMetricComp !== "powerState" && (
											<>
												<Text style={styles.label}>
													{differenceCondition === "between"
														? "Min Difference"
														: "Difference Value"}
												</Text>
												<TextInput
													style={[
														styles.input,
														Platform.OS === "web" && styles.webInput,
													]}
													keyboardType="numeric"
													value={differenceValue}
													onChangeText={setDifferenceValue}
													placeholder={
														differenceCondition === "between"
															? "Enter Minimum Difference"
															: "Enter Difference Value"
													}
													autoCapitalize="none"
													placeholderTextColor="#888"
												/>

												{differenceCondition === "between" && (
													<>
														<Text style={styles.label}>Max Difference</Text>
														<TextInput
															style={[
																styles.input,
																Platform.OS === "web" && styles.webInput,
															]}
															keyboardType="numeric"
															value={differenceValue2}
															onChangeText={setDifferenceValue2}
															placeholder="Enter Maximum Difference"
															autoCapitalize="none"
															placeholderTextColor="#888"
														/>
													</>
												)}
											</>
										)}
								</>
							)}
						</>
					)}
				</ScrollView>
			</View>
		);
	};

	/* ----------------------------------------------------------------
	 * Rendering: Step 2
	 * ---------------------------------------------------------------- */
	const renderStep2 = () => {
		if (actionType === "scheduled") return renderStep2Scheduled();
		if (actionType === "triggeredSingle")
			return renderStep2TriggeredSingleDevice();
		if (actionType === "triggeredComparison")
			return renderStep2TriggeredComparison();
		return null;
	};

	/* ----------------------------------------------------------------
	 * Rendering: Step 3 (Summary & Actions)
	 * ---------------------------------------------------------------- */
	const renderStep3 = () => {
		const actionTypeOptions = availableActions;

		const groupedDevicesData = getGroupedDevicesData(locations);

		const renderTriggerSummary = () => {
			// Helper to format the summary visually
			const SummaryRow = ({ icon, label, value, highlight = false }) => (
				<View style={styles.summaryRow}>
					{icon && (
						<View style={styles.iconContainer}>
							<MaterialIcons
								name={icon}
								size={20}
								color={highlight ? COLORS.primary : COLORS.textDark}
							/>
						</View>
					)}
					<Text
						style={[styles.summaryLabel, highlight && styles.summaryHighlight]}
					>
						{label}
					</Text>
					<Text
						style={[styles.summaryValue, highlight && styles.summaryHighlight]}
					>
						{value}
					</Text>
				</View>
			);

			return (
				<View style={styles.summaryBox}>
					<Text style={styles.subSectionTitle}>Trigger Summary</Text>

					{/* Display all triggers with their conditions */}
					{triggers.map((trigger, index) => (
						<View key={index}>
							{trigger.condition && index > 0 && (
								<SummaryRow
									icon={
										trigger.condition === "and" ? "toggle-on" : "toggle-off"
									}
									label={`Condition between Trigger ${index} and Trigger ${
										index + 1
									}`}
									value={trigger.condition.toUpperCase()}
								/>
							)}
							{/* Display trigger details */}
							{trigger.type === "scheduled" && (
								<>
									<SummaryRow
										icon="schedule"
										label="Type"
										value="Scheduled"
										highlight
									/>
									<SummaryRow
										icon="calendar-today"
										label="Days of Week"
										value={trigger.days_of_week.join(", ")}
									/>
									<SummaryRow
										icon="access-time"
										label={`Common Time`}
										value={trigger.common_time}
									/>
								</>
							)}

							{trigger.type === "single_device" && (
								<>
									<SummaryRow
										icon="sensors"
										label="Type"
										value="Single-Device Trigger"
										highlight
									/>
									<SummaryRow
										icon="device-hub"
										label="Device"
										value={
											locations
												.flatMap((loc) => loc.bins)
												.flatMap((bin) => bin.devices)
												.find((d) => d.value === trigger.device_id)?.name ||
											"Unknown"
										}
									/>
									<SummaryRow
										icon={metricIcons[trigger.metric] || "analytics"}
										label="Metric"
										value={
											metricsSingle.find((m) => m.value === trigger.metric)
												?.label || "N/A"
										}
									/>
									<SummaryRow
										icon="compare"
										label="Condition"
										value={
											trigger.metric === "powerState"
												? trigger.value === true
													? "Is On"
													: "Is Off"
												: trigger.condition === "between"
													? `${trigger.value[0]} - ${trigger.value[1]}`
													: trigger.value
										}
									/>
								</>
							)}

							{trigger.type === "two_device_diff" && (
								<>
									<SummaryRow
										icon="compare-arrows"
										label="Type"
										value="Two-Device Comparison"
										highlight
									/>
									<SummaryRow
										icon="device-hub"
										label="Device 1"
										value={
											locations
												.flatMap((loc) => loc.bins)
												.flatMap((bin) => bin.devices)
												.find((d) => d.value === trigger.device1.device_id)
												?.name || "Unknown"
										}
									/>
									<SummaryRow
										icon="device-hub"
										label="Device 2"
										value={
											locations
												.flatMap((loc) => loc.bins)
												.flatMap((bin) => bin.devices)
												.find((d) => d.value === trigger.device2.device_id)
												?.name || "Unknown"
										}
									/>
									<SummaryRow
										icon={metricIcons[trigger.metric] || "analytics"}
										label="Metric"
										value={
											metricsComp.find((m) => m.value === trigger.metric)
												?.label || "N/A"
										}
									/>
									<SummaryRow
										icon="rule"
										label="Difference Condition"
										value={
											trigger.metric === "powerState"
												? trigger.value === true
													? "Difference Is On"
													: "Difference Is Off"
												: trigger.condition === "between"
													? `${trigger.value[0]} - ${trigger.value[1]}`
													: trigger.value
										}
									/>
								</>
							)}

							{/* Edit and Remove Buttons */}
							<View style={styles.triggerActionsContainer}>
								<TouchableOpacity
									style={styles.editButton}
									onPress={() => handleEditTrigger(index)}
								>
									<MaterialIcons name="edit" size={20} color="#FFF" />
									<Text style={styles.editButtonText}>Edit</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.removeButtonSummary}
									onPress={() => handleRemoveTrigger(index)}
								>
									<MaterialIcons name="delete" size={20} color="#FFF" />
									<Text style={styles.removeButtonTextSummary}>Remove</Text>
								</TouchableOpacity>
							</View>
						</View>
					))}
				</View>
			);
		};

		return (
			<ScrollView style={styles.stepContainer}>
				<Text style={styles.stepTitle}>When: </Text>

				{/* Trigger Summary Card */}
				{renderTriggerSummary()}

				{/* **Add Trigger with AND/OR** */}
				<TouchableOpacity
					style={styles.addButton}
					onPress={() => {
						setIsOperatorModalVisible(true);
					}}
				>
					<MaterialIcons name="add" size={20} color="#FFF" />
					<Text style={styles.addButtonText}>Add Trigger</Text>
				</TouchableOpacity>

				<Text style={styles.stepTitle}>Do: </Text>

				{/* Actions Configuration */}
				<Text style={styles.subSectionTitle}>Actions</Text>
				{actions.map((action, index) => {
					// Get action details from availableActions
					const actionDetails = availableActions.find(
						(a) => a.value === action.action_type
					);

					// Filter the bins for the selected location in this action
					const selectedLoc = locations.find(
						(l) => l.value === action.location_id
					);
					const binsForLocation = selectedLoc ? selectedLoc.bins : [];

					// Filter devices for the selected bin
					const selectedBinInLoc = binsForLocation.find(
						(b) => b.value === action.bin_id
					);
					const devicesForBin = selectedBinInLoc
						? selectedBinInLoc.devices
						: [];

					return (
						<View key={action.id} style={styles.actionItem}>
							<Text style={styles.label}>Action Type</Text>
							<View style={styles.actionTypeContainer}>
								<MaterialIcons
									name={actionDetails?.icon || "device-hub"}
									size={24}
									color="#71A12F"
								/>
								<Text style={styles.actionTypeLabel}>
									{actionDetails?.label || "Unknown Action"}
								</Text>
							</View>

							{/* Depending on action_type, render specific configurations */}
							{action.action_type === "send_notification" && (
								<>
									<Text style={styles.label}>Notification Message</Text>
									<TextInput
										style={[
											styles.input,
											Platform.OS === "web" && styles.webInput,
										]}
										placeholder="Enter your notification message"
										value={action.notification_message || ""}
										onChangeText={(text) =>
											handleUpdateAction(index, "notification_message", text)
										}
										autoCapitalize="none"
										keyboardType="default"
										placeholderTextColor="#888"
									/>
								</>
							)}

							{(action.action_type === "turn_on_relay" ||
								action.action_type === "turn_off_relay") && (
								<>
									<Text style={styles.label}>Select Relay Device</Text>
									{locationsLoading ? (
										<ActivityIndicator size="small" color="#71A12F" />
									) : locationsError ? (
										<View>
											<Text style={styles.errorText}>{locationsError}</Text>
											<TouchableOpacity
												onPress={() => {
													/* Retry Logic */
													setLocationsError(null);
													setLocationsLoading(true);
													locationService
														.getLocationsForUser(userId)
														.then((userLocations) => {
															console.log(
																"Fetched userLocations from API:",
																userLocations
															);
															setLocations(userLocations);
														})
														.catch((error) => {
															console.error("Failed to load locations:", error);
															setLocationsError("Failed to load locations");
															Alert.alert("Error", "Failed to load locations");
														})
														.finally(() => {
															setLocationsLoading(false);
														});
												}}
											>
												<Text style={styles.retryText}>Tap to Retry</Text>
											</TouchableOpacity>
										</View>
									) : locations.length === 0 ? (
										<Text style={styles.infoText}>
											You have no locations. Please add locations first.
										</Text>
									) : (
										<LocationsList
											data={locations}
											selectedDevice={action.device_id}
											onDeviceSelect={(locId, binId, devId) => {
												handleUpdateAction(index, "location_id", locId);
												handleUpdateAction(index, "bin_id", binId);
												handleUpdateAction(index, "device_id", devId);
											}}
											selectable={true}
										/>
									)}
								</>
							)}

							{/* You can add more configurations based on action_type */}

							<TouchableOpacity
								style={styles.removeButton}
								onPress={() => handleRemoveAction(index)}
							>
								<MaterialIcons name="delete" size={20} color="#000" />
								<Text style={styles.removeButtonText}>Remove Action</Text>
							</TouchableOpacity>
						</View>
					);
				})}

				<TouchableOpacity style={styles.addButton} onPress={handleAddAction}>
					<MaterialIcons name="add" size={20} color="#FFF" />
					<Text style={styles.addButtonText}>Add Action</Text>
				</TouchableOpacity>

				{/* Action Selection Modal */}
				<Modal
					visible={isActionModalVisible}
					animationType="slide"
					transparent={true}
					onRequestClose={() => setIsActionModalVisible(false)}
				>
					<TouchableWithoutFeedback
						onPress={() => setIsActionModalVisible(false)}
					>
						<View style={styles.modalOverlay} />
					</TouchableWithoutFeedback>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select an Action</Text>
						<ScrollView>
							{availableActions.map((action) => (
								<ActionCard
									key={action.value}
									action={action}
									isSelected={false}
									onSelect={handleSelectActionType}
								/>
							))}
						</ScrollView>
						<TouchableOpacity
							style={styles.modalCloseButton}
							onPress={() => setIsActionModalVisible(false)}
						>
							<Text style={styles.modalCloseButtonText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</Modal>

				{/* **Operator Selection Modal** */}
				<Modal
					visible={isOperatorModalVisible}
					transparent={true}
					animationType="fade"
					onRequestClose={() => setIsOperatorModalVisible(false)}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.operatorModalContent}>
							<Text style={styles.modalTitle}>Add Another Trigger</Text>
							<Text style={styles.modalSubtitle}>
								Choose a logical operator to connect with the existing triggers:
							</Text>
							<TouchableOpacity
								style={styles.operatorButton}
								onPress={() => handleOperatorSelection("and")}
							>
								<Text style={styles.operatorButtonText}>AND</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.operatorButton}
								onPress={() => handleOperatorSelection("or")}
							>
								<Text style={styles.operatorButtonText}>OR</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.modalCloseButton}
								onPress={() => setIsOperatorModalVisible(false)}
							>
								<Text style={styles.modalCloseButtonText}>
									Proceed to Actions
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			</ScrollView>
		);
	};

	/* ----------------------------------------------------------------
	 * Final Step Rendering
	 * ---------------------------------------------------------------- */
	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return renderStep1();
			case 2:
				return renderStep2();
			case 3:
				return renderStep3();
			default:
				return null;
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			{Platform.OS !== "web" ? (
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={styles.container}>
						{/* Header */}
						<View style={styles.backContainer}>
							<BackButton label="Back" />
						</View>

						<View style={styles.headerContainer}>
							<Text style={styles.headerTitle}>Create New Action</Text>
							<View style={{ width: 24 }} />
						</View>

						{/* Progress Bar */}
						<View style={styles.progressContainer}>
							<Progress.Bar
								progress={currentStep / steps.length}
								width={null}
								color="#71A12F"
								unfilledColor="#E0E0E0"
								borderWidth={0}
								height={10}
								borderRadius={5}
							/>
							<Text style={styles.progressText}>
								Step {currentStep} of {steps.length}: {steps[currentStep - 1]}
							</Text>
						</View>

						{/* Content Area */}
						<View style={styles.contentContainer}>{renderCurrentStep()}</View>

						{/* Navigation Buttons */}
						{currentStep < 3 && (
							<View style={styles.navigationContainer}>
								{currentStep > 1 && (
									<TouchableOpacity
										style={styles.nextButton}
										onPress={handlePreviousStep}
									>
										<MaterialIcons name="arrow-back" size={24} color="#FFF" />
										<Text style={styles.nextButtonText}>Back</Text>
									</TouchableOpacity>
								)}
								{currentStep < steps.length && (
									<TouchableOpacity
										style={styles.nextButton}
										onPress={handleNextStep}
									>
										<Text style={styles.nextButtonText}>Next</Text>
										<MaterialIcons
											name="arrow-forward"
											size={24}
											color="#FFF"
										/>
									</TouchableOpacity>
								)}
							</View>
						)}

						{/* Submit Button only on step3 */}
						{currentStep === 3 && (
							<View style={styles.navigationContainer}>
								{triggers.length > 0 && actions.length > 0 && (
									<TouchableOpacity
										style={styles.submitButton}
										onPress={handleFinalSubmit}
									>
										<MaterialIcons name="save" size={24} color="#FFF" />
										<Text style={styles.submitButtonText}>Save Automation</Text>
									</TouchableOpacity>
								)}
							</View>
						)}
					</View>
				</TouchableWithoutFeedback>
			) : (
				<View style={styles.container}>
					{/* Header */}
					<View style={styles.backContainer}>
						<BackButton label="Back" />
					</View>

					<View style={styles.headerContainer}>
						<Text style={styles.headerTitle}>Create New Action</Text>
						<View style={{ width: 24 }} />
					</View>

					{/* Progress Bar */}
					<View style={styles.progressContainer}>
						<Progress.Bar
							progress={currentStep / steps.length}
							width={null}
							color="#71A12F"
							unfilledColor="#E0E0E0"
							borderWidth={0}
							height={10}
							borderRadius={5}
						/>
						<Text style={styles.progressText}>
							Step {currentStep} of {steps.length}: {steps[currentStep - 1]}
						</Text>
					</View>

					{/* Content Area */}
					<View style={styles.contentContainer}>{renderCurrentStep()}</View>

					{/* Navigation Buttons */}
					{currentStep < 3 && (
						<View style={styles.navigationContainer}>
							{currentStep > 1 && (
								<TouchableOpacity
									style={styles.nextButton}
									onPress={handlePreviousStep}
								>
									<MaterialIcons name="arrow-back" size={24} color="#FFF" />
									<Text style={styles.nextButtonText}>Back</Text>
								</TouchableOpacity>
							)}
							{currentStep < steps.length && (
								<TouchableOpacity
									style={styles.nextButton}
									onPress={handleNextStep}
								>
									<Text style={styles.nextButtonText}>Next</Text>
									<MaterialIcons name="arrow-forward" size={24} color="#FFF" />
								</TouchableOpacity>
							)}
						</View>
					)}

					{/* Submit Button only on step3 */}
					{currentStep === 3 && (
						<View style={styles.navigationContainer}>
							{triggers.length > 0 && actions.length > 0 && (
								<TouchableOpacity
									style={styles.submitButton}
									onPress={handleFinalSubmit}
								>
									<MaterialIcons name="save" size={24} color="#FFF" />
									<Text style={styles.submitButtonText}>Save Automation</Text>
								</TouchableOpacity>
							)}
						</View>
					)}
				</View>
			)}
		</SafeAreaView>
	);
};

export default AddAction;

/* ----------------------------------------------------------------
 * Example color palette (you could define this at the top of your file or in a separate theme/colors file)
 * ---------------------------------------------------------------- */
const COLORS = {
	primary: "#71A12F",
	background: "#F5F5F5",
	white: "#FFF",
	textDark: "#333",
	textLight: "#666",
	border: "#E0E0E0",
	error: "#F44336",
};

// Sizes for consistency
const SIZES = {
	base: 16, // a base spacing unit
	radius: 8, // standard border radius
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	container: {
		flex: 1,
		padding: SIZES.base,
		paddingBottom: SIZES.base * 2,
		marginBottom: 0,
	},
	backContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 0,
		paddingBottom: 0,
		padding: 0,
	},
	headerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 0,
		paddingTop: 0,
		marginBottom: 10,
	},
	headerTitle: {
		flex: 1,
		fontSize: 22,
		fontWeight: "bold",
		color: COLORS.textDark,
		alignContent: "center",
		textAlign: "center",
	},
	progressContainer: {
		marginBottom: SIZES.base,
	},
	progressText: {
		textAlign: "center",
		marginTop: 5,
		color: COLORS.textDark,
		fontSize: 14,
	},
	contentContainer: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: SIZES.base * 2,
	},
	sectionContainer: {
		borderRadius: SIZES.radius,
		padding: SIZES.base,
		marginBottom: SIZES.base,
		padding: 5,
	},

	/* Step Titles */
	stepContainer: {},
	stepContainerScroll: {
		paddingBottom: SIZES.base * 2,
	},
	stepTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: COLORS.textDark,
		marginBottom: SIZES.base,
		textAlign: "center",
	},

	/* Trigger Cards */
	triggerCard: {
		width: "100%",
		backgroundColor: COLORS.white,
		borderRadius: SIZES.radius,
		padding: 15, // Reduced padding for compactness
		marginBottom: 10, // Reduced margin
		borderWidth: 2,
		borderColor: COLORS.border,
		flexDirection: "row",
		alignItems: "center",
	},
	selectedCard: {
		borderColor: COLORS.primary,
		backgroundColor: "#F8FCF3",
	},
	triggerTextContainer: {
		marginLeft: 10, // Reduced margin
		flex: 1,
	},
	triggerTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: COLORS.textDark,
		marginBottom: 3, // Reduced margin
	},
	triggerDescription: {
		fontSize: 14,
		color: COLORS.textLight,
	},

	/* Labels & Inputs */
	label: {
		fontSize: 16,
		color: COLORS.textDark,
		marginBottom: 4, // Reduced margin
	},
	dropdown: {
		backgroundColor: "#F9F9F9",
		borderColor: COLORS.border,
		borderRadius: SIZES.radius,
		marginBottom: 10, // Reduced margin
		paddingLeft: 12,
		paddingRight: 12,
		height: 45, // Reduced height
	},
	placeholderStyle: {
		fontSize: 16,
		color: "#999",
	},
	selectedTextStyle: {
		fontSize: 16,
		color: COLORS.textDark,
	},
	inputSearchStyle: {
		height: 40,
		fontSize: 16,
	},
	iconStyle: {
		width: 20,
		height: 20,
		display: "none",
	},

	input: {
		backgroundColor: "#F9F9F9",
		borderRadius: SIZES.radius,
		padding: 12, // Reduced padding
		fontSize: 16,
		color: COLORS.textDark,
		marginBottom: 12, // Reduced margin
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	webInput: {
		outlineStyle: "none", // Removes the outline specifically for web
	},

	/* Date Picker */
	datePickerButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9F9F9",
		padding: 10, // Reduced padding
		borderRadius: SIZES.radius,
		marginBottom: 10, // Reduced margin
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	datePickerText: {
		marginLeft: 8, // Reduced margin
		fontSize: 16,
		color: COLORS.textDark,
	},

	/* Badges for Metrics */
	badgeContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		marginBottom: 10, // Reduced margin
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 6, // Reduced padding
		paddingHorizontal: 10, // Reduced padding
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: 20,
		margin: 3, // Reduced margin
		backgroundColor: "#F9F9F9",
	},
	badgeActive: {
		borderColor: COLORS.primary,
		backgroundColor: "#ECF9E6",
	},
	badgeText: {
		fontSize: 14,
		color: COLORS.textDark,
	},
	badgeTextActive: {
		fontWeight: "600",
		color: COLORS.primary,
	},

	/* Sub-Section Titles */
	subSectionTitle: {
		fontSize: 16,
		fontWeight: "bold",
		color: COLORS.textDark,
		marginBottom: 6, // Reduced margin
		marginTop: 8, // Reduced margin
	},

	/* Step Navigation */
	navigationContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: SIZES.base,
		borderTopWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.background,
	},
	nextButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.primary,
		paddingVertical: 10,
		paddingHorizontal: 12, // Reduced padding
		borderRadius: SIZES.radius,
		justifyContent: "center",
		flex: 1,
		marginHorizontal: 4, // Reduced margin
	},
	nextButtonText: {
		color: COLORS.white,
		fontSize: 16,
		marginRight: 5,
	},
	submitButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.primary,
		paddingVertical: 12, // Reduced padding
		paddingHorizontal: 16, // Reduced padding
		borderRadius: SIZES.radius,
		alignSelf: "center",
		marginTop: 8, // Reduced margin
	},
	submitButtonText: {
		color: COLORS.white,
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},

	/* Actions List */
	actionItem: {
		marginBottom: 12, // Reduced margin
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: SIZES.radius,
		padding: SIZES.base,
		backgroundColor: "#F9F9F9",
	},
	removeButton: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8, // Reduced margin
	},
	removeButtonText: {
		fontSize: 16,
		marginLeft: 5,
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.primary,
		paddingVertical: 10,
		paddingHorizontal: 12, // Reduced padding
		borderRadius: SIZES.radius,
		alignSelf: "flex-start",
		marginTop: 8, // Reduced margin
	},
	addButtonText: {
		color: COLORS.white,
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},

	/* Error & Info States */
	errorText: {
		color: COLORS.error,
		fontSize: 16,
		marginBottom: 8, // Reduced margin
	},
	infoText: {
		color: COLORS.textLight,
		fontSize: 16,
		textAlign: "center",
		marginVertical: 8, // Reduced margin
	},
	retryText: {
		color: COLORS.primary,
		fontSize: 16,
		textAlign: "center",
		marginTop: 8, // Reduced margin
		textDecorationLine: "underline",
	},
	removeButtonSummary: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.error,
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: SIZES.radius,
		marginTop: 4,
		marginRight: 10,
	},
	editButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.primary,
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: SIZES.radius,
		marginTop: 4,
		marginRight: 10,
	},
	editButtonText: {
		color: COLORS.white,
		fontSize: 14,
		marginLeft: 4,
	},
	removeButtonTextSummary: {
		color: COLORS.white,
		fontSize: 14,
		marginLeft: 4,
	},

	/* Summary Box */
	summaryRow: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 6, // Reduced margin
	},
	iconContainer: {
		width: 25, // Reduced width
		height: 25, // Reduced height
		justifyContent: "center",
		alignItems: "center",
		marginRight: 8, // Reduced margin
	},
	summaryLabel: {
		fontSize: 14,
		color: COLORS.textLight,
		flex: 1,
		fontWeight: "600",
	},
	summaryValue: {
		fontSize: 14,
		color: COLORS.textDark,
		fontWeight: "400",
	},
	summaryHighlight: {
		color: COLORS.primary,
		fontWeight: "bold",
	},
	summaryBox: {
		borderRadius: SIZES.radius,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: SIZES.base,
		marginBottom: SIZES.base,
	},

	/* Action Type Display */
	actionTypeContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 6, // Reduced margin
	},
	actionTypeLabel: {
		fontSize: 16,
		color: COLORS.textDark,
		marginLeft: 8, // Reduced margin
		fontWeight: "600",
	},

	/* Modal Styles */
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		maxHeight: "80%",
		backgroundColor: COLORS.white,
		borderTopLeftRadius: SIZES.radius,
		borderTopRightRadius: SIZES.radius,
		padding: SIZES.base,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: COLORS.textDark,
		marginBottom: SIZES.base,
		textAlign: "center",
	},
	modalSubtitle: {
		fontSize: 16,
		color: COLORS.textDark,
		marginBottom: SIZES.base,
		textAlign: "center",
	},
	modalCloseButton: {
		marginTop: SIZES.base,
		backgroundColor: COLORS.primary,
		paddingVertical: 10,
		borderRadius: SIZES.radius,
		alignItems: "center",
	},
	modalCloseButtonText: {
		color: COLORS.white,
		fontSize: 16,
		fontWeight: "bold",
		paddingLeft: 10,
		paddingRight: 10,
	},

	operatorModalContent: {
		width: "80%",
		backgroundColor: COLORS.white,
		borderRadius: SIZES.radius,
		padding: SIZES.base,
		alignItems: "center",
	},
	operatorButton: {
		width: "100%",
		padding: 12,
		backgroundColor: COLORS.primary,
		borderRadius: SIZES.radius,
		marginVertical: 6,
		alignItems: "center",
	},
	operatorButtonText: {
		color: COLORS.white,
		fontSize: 16,
		fontWeight: "bold",
	},

	/* Additional Step Content */
	additionalStepContent: {
		paddingTop: SIZES.base,
	},

	inlineSummary: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
	},
	inlineSummaryItem: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: 12,
		marginBottom: 6,
	},
	inlineSummaryText: {
		fontSize: 14,
		color: COLORS.textDark,
	},

	/* Trigger Actions Container */
	triggerActionsContainer: {
		flexDirection: "row",
		marginTop: 8,
	},

	/* Weekly Scheduler Styles */
	daysContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	dayButton: {
		flex: 1,
		minWidth: 60,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: SIZES.radius,
		marginRight: 8,
		marginBottom: 8,
		backgroundColor: COLORS.white,
		alignItems: "center",
	},
	dayButtonSelected: {
		backgroundColor: COLORS.primary,
		borderColor: COLORS.primary,
	},
	dayButtonText: {
		fontSize: 14,
		color: COLORS.textDark,
	},
	dayButtonTextSelected: {
		color: COLORS.white,
		fontWeight: "bold",
	},
	timePickerContainer: {
		marginBottom: 10,
	},
	timePickerButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9F9F9",
		padding: 10, // Reduced padding
		borderRadius: SIZES.radius,
		marginBottom: 10, // Reduced margin
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	timePickerText: {
		marginLeft: 8, // Reduced margin
		fontSize: 16,
		color: COLORS.textDark,
	},
	webTimePickerContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9F9F9",
		borderRadius: SIZES.radius,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 10,
	},
	webTimeInput: {
		// Remove the default border for a cleaner look
		borderWidth: 0,
		// Add a bottom border to mimic the DateTimePicker style
		borderBottomWidth: 1,
		borderColor: COLORS.border,
		// Adjust padding and margin as needed
		paddingVertical: 8,
		paddingHorizontal: 10,
		fontSize: 16,
		color: COLORS.textDark,
	},
});

/* ----------------------------------------------------------------
 * ConditionBadge Component
 * ---------------------------------------------------------------- */
/**
 * ConditionBadge Component
 * @param {Object} props
 * @param {Array<{label: string, value: string, icon: string}>} props.options - Condition options
 * @param {string} props.selectedValue - Currently selected condition
 * @param {Function} props.onSelect - Function to call when a condition is selected
 */
const ConditionBadge = ({ options, selectedValue, onSelect }) => {
	return (
		<View style={styles.badgeContainer}>
			{options.map((option) => {
				const isActive = selectedValue === option.value;
				return (
					<TouchableOpacity
						key={option.value}
						style={[styles.badge, isActive && styles.badgeActive]}
						onPress={() => onSelect(option.value)}
					>
						<MaterialIcons
							name={option.icon}
							size={16}
							color={isActive ? COLORS.primary : COLORS.textDark}
							style={{ marginRight: 4 }} // Reduced margin
						/>
						<Text
							style={[styles.badgeText, isActive && styles.badgeTextActive]}
						>
							{option.label}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

/* ----------------------------------------------------------------
 * ActionCard Component
 * ---------------------------------------------------------------- */
/**
 * ActionCard Component
 * @param {Object} props
 * @param {{label: string, value: string, icon: string, description: string}} props.action - Action details
 * @param {boolean} props.isSelected - Whether the action is selected
 * @param {Function} props.onSelect - Function to call when the action is selected
 */
const ActionCard = ({ action, isSelected, onSelect }) => {
	return (
		<TouchableOpacity
			style={[
				styles.triggerCard, // Reusing triggerCard styles for consistency
				isSelected && styles.selectedCard,
			]}
			onPress={() => onSelect(action.value)}
		>
			<MaterialIcons name={action.icon} size={28} color="#71A12F" />{" "}
			{/* Slightly reduced size */}
			<View style={styles.triggerTextContainer}>
				<Text style={styles.triggerTitle}>{action.label}</Text>
				<Text style={styles.triggerDescription}>{action.description}</Text>
			</View>
		</TouchableOpacity>
	);
};
