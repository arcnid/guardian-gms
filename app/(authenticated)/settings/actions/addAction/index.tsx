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
} from "react-native";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "@/contexts/AuthContext";
import { ActionService } from "@/services/actions/service";
import BackButton from "@/components/BackButton";
import * as Progress from "react-native-progress";
import { Dropdown } from "react-native-element-dropdown";
import { locationService } from "@/services/locations/service";
import { LocationsList } from "@/components/locations/Locations";
import { UserDeviceService } from "@/services/userDevice/service";

/**
 * NOTE: We now have three potential values for `actionType`:
 * 1) "scheduled"
 * 2) "triggeredSingle"
 * 3) "triggeredComparison"
 */
const AddAction = () => {
	const { userId } = useContext(AuthContext);

	const [currentStep, setCurrentStep] = useState(1);
	const steps = [
		"Select Trigger Type",
		"Configure Trigger",
		"Configure Actions",
	];

	// Step 1
	const [actionType, setActionType] = useState(null);

	// Step 2 (Scheduled)
	const [scheduleType, setScheduleType] = useState(null); // "date-time" or "interval"
	const [scheduledDateTime, setScheduledDateTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [interval, setIntervalValue] = useState("");

	// ----------------------------------------------------------------------------
	// Step 2 (Triggered) -> Single-Device states
	// ----------------------------------------------------------------------------
	const [selectedLocation, setSelectedLocation] = useState(null);
	const [selectedBin, setSelectedBin] = useState(null);
	const [selectedDevice, setSelectedDevice] = useState(null);

	const [selectedMetric, setSelectedMetric] = useState(null);
	const [selectedCondition, setSelectedCondition] = useState(null);
	const [conditionValue, setConditionValue] = useState("");
	const [secondaryConditionValue, setSecondaryConditionValue] = useState("");

	// ----------------------------------------------------------------------------
	// Step 2 (Triggered) -> Two-Device Comparison states
	// ----------------------------------------------------------------------------
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
			return;
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
	}, [selectedDevice2Comp, deviceType1]);

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
			// 2a) SCHEDULED
			if (actionType === "scheduled") {
				if (!scheduleType) {
					Alert.alert(
						"Configuration Required",
						"Please select a schedule type"
					);
					return;
				}
				if (scheduleType === "date-time" && !scheduledDateTime) {
					Alert.alert("Configuration Required", "Please select date/time");
					return;
				}
				if (scheduleType === "interval" && !interval) {
					Alert.alert("Configuration Required", "Please enter an interval");
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

		// Step 3 validation
		if (currentStep === 3 && actions.length === 0) {
			Alert.alert("Configuration Required", "Please add at least one action");
			return;
		}

		setCurrentStep((prev) => Math.min(prev + 1, steps.length));
	};

	const handlePreviousStep = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	/* ----------------------------------------------------------------
	 * Step 3: Actions
	 * ---------------------------------------------------------------- */
	const handleAddAction = () => {
		setActions((prev) => [
			...prev,
			{
				location_id: null,
				bin_id: null,
				device_id: null,
				action_type: null,
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
	};

	const handleRemoveAction = (index) => {
		const updated = actions.filter((_, idx) => idx !== index);
		setActions(updated);

		const focusCopy = { ...actionDropdownFocus };
		delete focusCopy[index];
		setActionDropdownFocus(focusCopy);
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
	 * Final Submit
	 * ---------------------------------------------------------------- */
	const handleSubmit = async () => {
		// Final validation to ensure both devices match
		if (actionType === "triggeredComparison") {
			const deviceType2 = getDeviceType(selectedDevice2Comp);
			if (deviceType1 !== deviceType2) {
				Alert.alert(
					"Validation Error",
					"Device 2 must be the same type as Device 1."
				);
				return;
			}
		}

		try {
			let trigger = {};

			if (actionType === "scheduled") {
				// SCHEDULED
				if (scheduleType === "date-time") {
					trigger = {
						schedule_type: "date-time",
						datetime: scheduledDateTime.toISOString(),
					};
				} else {
					trigger = {
						schedule_type: "interval",
						interval,
					};
				}
			} else if (actionType === "triggeredSingle") {
				// SINGLE DEVICE
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
				};
			} else if (actionType === "triggeredComparison") {
				// TWO DEVICE
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
				};
			}

			const newAction = {
				user_id: userId,
				type: actionType === "scheduled" ? "scheduled" : "triggered",
				trigger,
				actions,
			};

			await ActionService.addAction(newAction);
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
		setScheduleType(null);
		setScheduledDateTime(new Date());
		setShowDatePicker(false);
		setIntervalValue("");

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
	};

	/* ----------------------------------------------------------------
	 * Rendering: Step 1
	 * We show 3 separate triggers: SCHEDULED, SINGLE DEVICE, TWO DEVICE
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
						Run actions at specific intervals
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
	 * Rendering: Step 2 (Scheduled)
	 * ---------------------------------------------------------------- */
	const renderStep2Scheduled = () => (
		<View style={styles.stepContainer}>
			<Text style={styles.stepTitle}>Schedule Configuration</Text>

			<Text style={styles.label}>Schedule Type</Text>
			<Dropdown
				style={[styles.dropdown, isFocusTriggerType && { borderColor: "blue" }]}
				placeholderStyle={styles.placeholderStyle}
				selectedTextStyle={styles.selectedTextStyle}
				inputSearchStyle={styles.inputSearchStyle}
				iconStyle={styles.iconStyle}
				data={[
					{ label: "Specific Time", value: "date-time" },
					{ label: "Repeating Interval", value: "interval" },
				]}
				search={false}
				maxHeight={300}
				labelField="label"
				valueField="value"
				placeholder={!isFocusTriggerType ? "Select Schedule Type" : "..."}
				value={scheduleType}
				onFocus={() => setIsFocusTriggerType(true)}
				onBlur={() => setIsFocusTriggerType(false)}
				onChange={(item) => {
					setScheduleType(item.value);
					setIsFocusTriggerType(false);
				}}
				renderLeftIcon={() => (
					<AntDesign
						style={styles.icon}
						color={isFocusTriggerType ? "blue" : "black"}
						name="Safety"
						size={20}
					/>
				)}
			/>

			{scheduleType === "date-time" && (
				<>
					<Text style={styles.label}>Select Date & Time</Text>
					<TouchableOpacity
						style={styles.datePickerButton}
						onPress={() => setShowDatePicker(true)}
					>
						<MaterialIcons name="event" size={24} color="#71A12F" />
						<Text style={styles.datePickerText}>
							{scheduledDateTime.toLocaleString()}
						</Text>
					</TouchableOpacity>

					{showDatePicker && (
						<DateTimePicker
							value={scheduledDateTime}
							mode="datetime"
							display="default"
							onChange={(event, date) => {
								setShowDatePicker(Platform.OS === "ios");
								if (date) setScheduledDateTime(date);
							}}
						/>
					)}
				</>
			)}

			{scheduleType === "interval" && (
				<>
					<Text style={styles.label}>Repeat Interval</Text>
					<TextInput
						style={styles.input}
						placeholder="e.g., 24h (24 hours), 1d (1 day)"
						value={interval}
						onChangeText={setIntervalValue}
					/>
				</>
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
					<>
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
							<>
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
							</>
						)}

						{selectedCondition && (
							<>
								<Text style={styles.label}>
									{selectedCondition === "between"
										? "Minimum Value"
										: "Target Value"}
								</Text>
								<TextInput
									style={styles.input}
									keyboardType="numeric"
									value={conditionValue}
									onChangeText={setConditionValue}
									placeholder={
										selectedCondition === "between"
											? "Enter Minimum Value"
											: "Enter Value"
									}
								/>

								{selectedCondition === "between" && (
									<>
										<Text style={styles.label}>Maximum Value</Text>
										<TextInput
											style={styles.input}
											keyboardType="numeric"
											value={secondaryConditionValue}
											onChangeText={setSecondaryConditionValue}
											placeholder="Enter Maximum Value"
										/>
									</>
								)}
							</>
						)}
					</>
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
					// Use our filtered location data so only same-type devices appear and exclude Device 1
					<LocationsList
						data={filteredLocationsForDevice2}
						selectedDevice={selectedDevice2Comp}
						onDeviceSelect={(locId, binId, devId) => {
							setSelectedLocation2Comp(locId);
							setSelectedBin2Comp(binId);
							setSelectedDevice2Comp(devId);
							// Since both devices share the same metric, no need to reset metric here
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
					</>
				)}

				{/* Single Metric for Both Devices */}
				{selectedDevice2Comp && selectedMetricComp && (
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

						{differenceCondition && (
							<>
								<Text style={styles.label}>
									{differenceCondition === "between"
										? "Min Difference"
										: "Difference Value"}
								</Text>
								<TextInput
									style={styles.input}
									keyboardType="numeric"
									value={differenceValue}
									onChangeText={setDifferenceValue}
									placeholder={
										differenceCondition === "between"
											? "Enter Minimum Difference"
											: "Enter Difference Value"
									}
								/>

								{differenceCondition === "between" && (
									<>
										<Text style={styles.label}>Max Difference</Text>
										<TextInput
											style={styles.input}
											keyboardType="numeric"
											value={differenceValue2}
											onChangeText={setDifferenceValue2}
											placeholder="Enter Maximum Difference"
										/>
									</>
								)}
							</>
						)}
					</>
				)}
			</View>
		);
	};

	/* ----------------------------------------------------------------
	 * Combining Step 2 logic
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
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<SafeAreaView style={styles.safeArea}>
				<ScrollView contentContainerStyle={styles.container}>
					{/* Header */}
					<View style={styles.headerContainer}>
						<BackButton label="Back" />
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

					{/* Step Content */}
					<View style={styles.sectionContainer}>{renderCurrentStep()}</View>

					{/* Navigation Buttons */}
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
						{currentStep === steps.length && (
							<TouchableOpacity
								style={styles.submitButton}
								onPress={handleSubmit}
							>
								<MaterialIcons name="save" size={24} color="#FFF" />
								<Text style={styles.submitButtonText}>Save Automation</Text>
							</TouchableOpacity>
						)}
					</View>
				</ScrollView>
			</SafeAreaView>
		</TouchableWithoutFeedback>
	);
};

export default AddAction;

// Example color palette (you could define this at the top of your file or in a separate theme/colors file)
const COLORS = {
	primary: "#71A12F",
	background: "#F5F5F5",
	white: "#FFF",
	textDark: "#333",
	textLight: "#666",
	border: "#E0E0E0",
	error: "#F44336",
};

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
		padding: SIZES.base,
		paddingBottom: SIZES.base * 2,
	},
	headerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: SIZES.base * 1.25,
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
	sectionContainer: {
		borderRadius: SIZES.radius,
		padding: SIZES.base,
		marginBottom: SIZES.base,
		padding: 5,
	},

	/* Step Titles */
	stepContainer: {},
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
		padding: 20,
		marginBottom: 15,
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
		marginLeft: 15,
		flex: 1,
	},
	triggerTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: COLORS.textDark,
		marginBottom: 5,
	},
	triggerDescription: {
		fontSize: 14,
		color: COLORS.textLight,
	},

	/* Labels & Inputs */
	label: {
		fontSize: 16,
		color: COLORS.textDark,
		marginBottom: 6,
	},
	dropdown: {
		backgroundColor: "#F9F9F9",
		borderColor: COLORS.border,
		borderRadius: SIZES.radius,
		marginBottom: 15,
		paddingLeft: 12,
		paddingRight: 12,
		height: 50,
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
		padding: 12,
		fontSize: 16,
		color: COLORS.textDark,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: COLORS.border,
	},

	/* Date Picker */
	datePickerButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9F9F9",
		padding: 12,
		borderRadius: SIZES.radius,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	datePickerText: {
		marginLeft: 10,
		fontSize: 16,
		color: COLORS.textDark,
	},

	/* Badges for Metrics */
	badgeContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		marginBottom: 15,
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: 20,
		margin: 4,
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
		marginBottom: 8,
		marginTop: 10,
	},

	/* Step Navigation */
	navigationContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	nextButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: COLORS.primary,
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: SIZES.radius,
		justifyContent: "center",
		flex: 1,
		marginHorizontal: 5,
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
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderRadius: SIZES.radius,
		alignSelf: "center",
		marginTop: 10,
	},
	submitButtonText: {
		color: COLORS.white,
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},

	/* Actions List */
	actionItem: {
		marginBottom: 15,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: SIZES.radius,
		padding: SIZES.base,
		backgroundColor: "#F9F9F9",
	},
	removeButton: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
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
		paddingHorizontal: 15,
		borderRadius: SIZES.radius,
		alignSelf: "flex-start",
		marginTop: 10,
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
		marginBottom: 10,
	},
	infoText: {
		color: COLORS.textLight,
		fontSize: 16,
		textAlign: "center",
		marginVertical: 10,
	},
	retryText: {
		color: COLORS.primary,
		fontSize: 16,
		textAlign: "center",
		marginTop: 10,
		textDecorationLine: "underline",
	},
});

/* ----------------------------------------------------------------
 * ConditionBadge Component
 * ---------------------------------------------------------------- */
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
							style={{ marginRight: 6 }}
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
