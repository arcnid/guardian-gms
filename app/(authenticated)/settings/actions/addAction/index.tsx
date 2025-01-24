// app/(authenticated)/AddAction.js
import React, { useState, useContext, useEffect } from "react";
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
	Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "@/contexts/AuthContext";
import { ActionService } from "@/services/actions/service";
import { UserDeviceService } from "@/services/userDevice/service";
import BackButton from "@/components/BackButton";
import * as Progress from "react-native-progress";
import { Dropdown } from "react-native-element-dropdown";

// DeviceCard Component
const DeviceCard = ({ device, isSelected, onSelect }) => {
	return (
		<TouchableOpacity
			style={[styles.card, isSelected && styles.selectedCard]}
			onPress={() => onSelect(device)}
			activeOpacity={0.8}
			accessible={true}
			accessibilityLabel={`Device ${device.label}, ${device.status}`}
		>
			<View style={styles.deviceInfo}>
				{device.image ? (
					<Image source={{ uri: device.image }} style={styles.deviceImage} />
				) : (
					<View style={[styles.deviceImage, styles.placeholderImage]}>
						<MaterialIcons name="device-hub" size={24} color="#FFFFFF" />
					</View>
				)}
				<View style={styles.deviceTextContainer}>
					<Text style={styles.deviceName}>{device.label}</Text>
					<View style={styles.statusContainer}>
						<MaterialIcons
							name={
								device.status === "Online" ? "check-circle" : "highlight-off"
							}
							size={16}
							color={device.status === "Online" ? "#4CAF50" : "#F44336"}
						/>
						<Text
							style={[
								styles.deviceStatus,
								{ color: device.status === "Online" ? "#4CAF50" : "#F44336" },
							]}
						>
							{device.status === "Online" ? "Online" : "Offline"}
						</Text>
					</View>
				</View>
			</View>
			{isSelected && (
				<MaterialIcons name="check-circle" size={24} color="#71A12F" />
			)}
		</TouchableOpacity>
	);
};

const AddAction = () => {
	const { userId } = useContext(AuthContext);
	const [currentStep, setCurrentStep] = useState(1);
	const steps = [
		"Select Trigger Type",
		"Configure Trigger",
		"Configure Actions",
	];

	// Step 1: Trigger Type
	const [actionType, setActionType] = useState(null); // 'scheduled' or 'triggered'

	// Step 2: Trigger Configuration
	// Scheduled Trigger States
	const [scheduleType, setScheduleType] = useState(null); // 'date-time' or 'interval'
	const [scheduledDateTime, setScheduledDateTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [interval, setIntervalValue] = useState("");

	// Device-Based Trigger States
	const [selectedDevice, setSelectedDevice] = useState(null);
	const [selectedMetric, setSelectedMetric] = useState(null);
	const [selectedCondition, setSelectedCondition] = useState(null);
	const [conditionValue, setConditionValue] = useState("");
	const [secondaryConditionValue, setSecondaryConditionValue] = useState("");

	// Step 3: Action Configuration
	const [actions, setActions] = useState([]);
	const [actionDeviceDropdownOpen, setActionDeviceDropdownOpen] = useState([]);
	const [actionTypeDropdownOpen, setActionTypeDropdownOpen] = useState([]);

	// General States
	const [devices, setDevices] = useState<any>([]);
	const [devicesLoading, setDevicesLoading] = useState(true);
	const [devicesError, setDevicesError] = useState(null);

	// Dropdown Control States (Focus States)
	const [isFocusTriggerType, setIsFocusTriggerType] = useState(false);
	const [isFocusDeviceList, setIsFocusDeviceList] = useState(false);
	const [isFocusMetricList, setIsFocusMetricList] = useState(false);
	const [isFocusConditionList, setIsFocusConditionList] = useState(false);

	// Similarly, manage focus states for actions
	const [actionDropdownFocus, setActionDropdownFocus] = useState({}); // key: index

	// Fetch devices on component mount
	const fetchDevices = async () => {
		setDevicesLoading(true);
		try {
			const userDevices = await UserDeviceService.getDevicesByUser(userId);
			console.log("Fetched Devices:", userDevices); // Debugging log

			setDevices(
				userDevices.map((device) => ({
					label: device.name || device.device_name || "Unnamed Device",
					value: device.id,
					type: device.type,
					status: device.status || "Online", // Default to Online if status not provided
					image: device.image || null, // Optional: handle device images
				}))
			);
		} catch (error) {
			console.error("Failed to load devices:", error);
			setDevicesError("Failed to load devices");
			Alert.alert("Error", "Failed to load devices");
		} finally {
			setDevicesLoading(false);
		}
	};

	useEffect(() => {
		fetchDevices();
	}, [userId]);

	// Helper Functions
	const getMetricsForDevice = (deviceId) => {
		const device = devices.find((d) => d.value === deviceId);
		if (!device) return [];
		if (device.type === "sensor")
			return [
				{ label: "Temperature", value: "temp" },
				{ label: "Humidity", value: "humidity" },
			];
		if (device.type === "relay")
			return [{ label: "Power State", value: "powerState" }];
		return [];
	};

	const getConditionOptions = (metric) => {
		if (metric === "powerState")
			return [
				{ label: "Is On", value: "eq" },
				{ label: "Is Off", value: "ne" },
			];
		return [
			{ label: "Above", value: "gt" },
			{ label: "Below", value: "lt" },
			{ label: "Between", value: "between" },
		];
	};

	const handleNextStep = () => {
		// Validation before moving to next step
		if (currentStep === 1 && !actionType) {
			Alert.alert("Selection Required", "Please select a trigger type");
			return;
		}
		if (currentStep === 2) {
			if (actionType === "scheduled") {
				if (!scheduleType) {
					Alert.alert(
						"Configuration Required",
						"Please select a schedule type"
					);
					return;
				}
				if (scheduleType === "date-time" && !scheduledDateTime) {
					Alert.alert("Configuration Required", "Please select date and time");
					return;
				}
				if (scheduleType === "interval" && !interval) {
					Alert.alert("Configuration Required", "Please enter an interval");
					return;
				}
			} else if (actionType === "triggered") {
				if (!selectedDevice || !selectedMetric || !selectedCondition) {
					Alert.alert(
						"Configuration Required",
						"Please complete trigger configuration"
					);
					return;
				}
				if (selectedCondition === "between") {
					if (!conditionValue || !secondaryConditionValue) {
						Alert.alert(
							"Configuration Required",
							"Please enter both minimum and maximum values"
						);
						return;
					}
				} else {
					if (!conditionValue) {
						Alert.alert("Configuration Required", "Please enter a value");
						return;
					}
				}
			}
		}
		if (currentStep === 3 && actions.length === 0) {
			Alert.alert("Configuration Required", "Please add at least one action");
			return;
		}
		setCurrentStep((prev) => Math.min(prev + 1, steps.length));
	};

	const handlePreviousStep = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	const handleAddAction = () => {
		setActions([
			...actions,
			{
				device_id: null,
				action_type: null,
			},
		]);
		// Initialize focus state for new action dropdowns
		setActionDropdownFocus((prev) => ({
			...prev,
			[actions.length]: { device: false, actionType: false },
		}));
	};

	const handleRemoveAction = (index) => {
		const updatedActions = actions.filter((_, idx) => idx !== index);
		setActions(updatedActions);

		const updatedFocus = { ...actionDropdownFocus };
		delete updatedFocus[index];
		setActionDropdownFocus(updatedFocus);
	};

	const handleUpdateAction = (index, field, value) => {
		const updatedActions = actions.map((action, idx) => {
			if (idx === index) {
				return { ...action, [field]: value };
			}
			return action;
		});
		setActions(updatedActions);
	};

	const handleSubmit = async () => {
		try {
			let trigger = {};
			if (actionType === "scheduled") {
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
			} else if (actionType === "triggered") {
				trigger = {
					device_id: selectedDevice,
					metric: selectedMetric,
					condition: selectedCondition,
					value:
						selectedCondition === "between"
							? [conditionValue, secondaryConditionValue]
							: conditionValue,
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

	const resetForm = () => {
		setCurrentStep(1);
		setActionType(null);
		setScheduleType(null);
		setScheduledDateTime(new Date());
		setShowDatePicker(false);
		setIntervalValue("");
		setSelectedDevice(null);
		setSelectedMetric(null);
		setSelectedCondition(null);
		setConditionValue("");
		setSecondaryConditionValue("");
		setActions([]);
		setActionDropdownFocus({});
	};

	// Step Components
	const renderStep1 = () => (
		<View style={styles.stepContainer}>
			<Text style={styles.stepTitle}>Select Trigger Type</Text>
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
						Run actions at specific times or intervals
					</Text>
				</View>
			</TouchableOpacity>

			<TouchableOpacity
				style={[
					styles.triggerCard,
					actionType === "triggered" && styles.selectedCard,
				]}
				onPress={() => setActionType("triggered")}
			>
				<MaterialIcons name="sensors" size={32} color="#71A12F" />
				<View style={styles.triggerTextContainer}>
					<Text style={styles.triggerTitle}>Device Trigger</Text>
					<Text style={styles.triggerDescription}>
						Run actions based on device sensor values
					</Text>
				</View>
			</TouchableOpacity>
		</View>
	);

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
				search
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

	const renderStep2Triggered = () => (
		<View style={styles.stepContainer}>
			<Text style={styles.stepTitle}>Configure Device Trigger</Text>

			<Text style={styles.label}>Select Device</Text>

			{devicesLoading ? (
				<ActivityIndicator size="large" color="#71A12F" />
			) : devicesError ? (
				<View>
					<Text style={styles.errorText}>{devicesError}</Text>
					<TouchableOpacity onPress={() => fetchDevices()}>
						<Text style={styles.retryText}>Tap to Retry</Text>
					</TouchableOpacity>
				</View>
			) : devices.length === 0 ? (
				<Text style={styles.infoText}>
					You have no devices. Please add devices first.
				</Text>
			) : (
				<View style={styles.deviceScrollContainer}>
					<ScrollView
						showsVerticalScrollIndicator={true}
						contentContainerStyle={styles.deviceScrollContent}
					>
						{devices.map((device) => (
							<DeviceCard
								key={device.value}
								device={device}
								isSelected={selectedDevice === device.value}
								onSelect={(selected) => setSelectedDevice(selected.value)}
							/>
						))}
					</ScrollView>
				</View>
			)}

			{selectedDevice && (
				<>
					<Text style={styles.label}>Select Metric</Text>
					<Dropdown
						style={[
							styles.dropdown,
							isFocusMetricList && { borderColor: "blue" },
						]}
						placeholderStyle={styles.placeholderStyle}
						selectedTextStyle={styles.selectedTextStyle}
						inputSearchStyle={styles.inputSearchStyle}
						iconStyle={styles.iconStyle}
						data={getMetricsForDevice(selectedDevice)}
						search
						maxHeight={300}
						labelField="label"
						valueField="value"
						placeholder={!isFocusMetricList ? "Select Metric" : "..."}
						searchPlaceholder="Search..."
						value={selectedMetric}
						onFocus={() => setIsFocusMetricList(true)}
						onBlur={() => setIsFocusMetricList(false)}
						onChange={(item) => {
							setSelectedMetric(item.value);
							setIsFocusMetricList(false);
							setSelectedCondition(null);
							setConditionValue("");
							setSecondaryConditionValue("");
						}}
						renderLeftIcon={() => (
							<AntDesign
								style={styles.icon}
								color={isFocusMetricList ? "blue" : "black"}
								name="Safety"
								size={20}
							/>
						)}
					/>
				</>
			)}

			{selectedMetric && (
				<>
					<Text style={styles.label}>Condition</Text>
					<Dropdown
						style={[
							styles.dropdown,
							isFocusConditionList && { borderColor: "blue" },
						]}
						placeholderStyle={styles.placeholderStyle}
						selectedTextStyle={styles.selectedTextStyle}
						inputSearchStyle={styles.inputSearchStyle}
						iconStyle={styles.iconStyle}
						data={getConditionOptions(selectedMetric)}
						search={false}
						maxHeight={300}
						labelField="label"
						valueField="value"
						placeholder={!isFocusConditionList ? "Select Condition" : "..."}
						searchPlaceholder="Search..."
						value={selectedCondition}
						onFocus={() => setIsFocusConditionList(true)}
						onBlur={() => setIsFocusConditionList(false)}
						onChange={(item) => {
							setSelectedCondition(item.value);
							setIsFocusConditionList(false);
							setConditionValue("");
							setSecondaryConditionValue("");
						}}
						renderLeftIcon={() => (
							<AntDesign
								style={styles.icon}
								color={isFocusConditionList ? "blue" : "black"}
								name="Safety"
								size={20}
							/>
						)}
					/>
				</>
			)}

			{selectedCondition && (
				<>
					<Text style={styles.label}>
						{selectedCondition === "between" ? "Minimum Value" : "Target Value"}
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
		</View>
	);

	// Define renderStep2 to handle conditional rendering based on actionType
	const renderStep2 = () => {
		if (actionType === "scheduled") {
			return renderStep2Scheduled();
		} else if (actionType === "triggered") {
			return renderStep2Triggered();
		}
		return null;
	};

	const renderStep3 = () => (
		<View style={styles.stepContainer}>
			<Text style={styles.stepTitle}>Configure Actions</Text>

			{actions.map((action, index) => (
				<View key={index} style={styles.actionItem}>
					<Text style={styles.subSectionTitle}>Action {index + 1}</Text>

					<Text style={styles.label}>Select Device</Text>
					{devicesLoading ? (
						<ActivityIndicator size="small" color="#71A12F" />
					) : devicesError ? (
						<Text style={styles.errorText}>{devicesError}</Text>
					) : devices.length === 0 ? (
						<Text style={styles.infoText}>
							You have no devices. Please add devices first.
						</Text>
					) : (
						<View style={styles.deviceScrollContainer}>
							<ScrollView
								showsVerticalScrollIndicator={false}
								contentContainerStyle={styles.deviceScrollContent}
							>
								{devices.map((device) => (
									<DeviceCard
										key={`${index}-${device.value}`}
										device={device}
										isSelected={action.device_id === device.value}
										onSelect={(selected) =>
											handleUpdateAction(index, "device_id", selected.value)
										}
									/>
								))}
							</ScrollView>
						</View>
					)}

					<Text style={styles.label}>Action Type</Text>
					<Dropdown
						style={[
							styles.dropdown,
							actionDropdownFocus[index]?.actionType && {
								borderColor: "green",
							},
						]}
						placeholderStyle={styles.placeholderStyle}
						selectedTextStyle={styles.selectedTextStyle}
						inputSearchStyle={styles.inputSearchStyle}
						iconStyle={styles.iconStyle}
						data={[
							{ label: "Turn On", value: "turn_on" },
							{ label: "Turn Off", value: "turn_off" },
							{ label: "Restart", value: "restart" },
							// Add more action types as needed
						]}
						search={false}
						maxHeight={300}
						labelField="label"
						valueField="value"
						placeholder={
							!actionDropdownFocus[index]?.actionType
								? "Select Action Type"
								: "..."
						}
						searchPlaceholder="Search..."
						value={action.action_type}
						onFocus={() =>
							setActionDropdownFocus((prev) => ({
								...prev,
								[index]: { ...prev[index], actionType: true },
							}))
						}
						onBlur={() =>
							setActionDropdownFocus((prev) => ({
								...prev,
								[index]: { ...prev[index], actionType: false },
							}))
						}
						onChange={(item) => {
							handleUpdateAction(index, "action_type", item.value);
							setActionDropdownFocus((prev) => ({
								...prev,
								[index]: { ...prev[index], actionType: false },
							}));
						}}
						renderLeftIcon={() => (
							<AntDesign
								style={styles.icon}
								color={
									actionDropdownFocus[index]?.actionType ? "blue" : "black"
								}
								name="Safety"
								size={20}
							/>
						)}
					/>

					<TouchableOpacity
						style={styles.removeButton}
						onPress={() => handleRemoveAction(index)}
					>
						<MaterialIcons name="remove-circle" size={24} color="#F44336" />
						<Text style={styles.removeButtonText}>Remove Action</Text>
					</TouchableOpacity>
				</View>
			))}

			<TouchableOpacity style={styles.addButton} onPress={handleAddAction}>
				<MaterialIcons name="add" size={24} color="#FFF" />
				<Text style={styles.addButtonText}>Add Action</Text>
			</TouchableOpacity>
		</View>
	);

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
						{/* Placeholder for alignment */}
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

					{/* Current Step Content */}
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

// Styles
const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F5F5F5",
	},
	container: {
		padding: 16,
		paddingBottom: 30,
	},
	headerContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		marginLeft: 20,
		marginTop: 15,
		flex: 1,
		textAlign: "center",
	},
	progressContainer: {
		marginBottom: 20,
	},
	progressText: {
		textAlign: "center",
		marginTop: 5,
		color: "#333",
		fontSize: 14,
	},
	sectionContainer: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 20,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	stepContainer: {
		// Additional styling if needed
	},
	stepTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#333",
		marginBottom: 20,
		textAlign: "center",
	},
	triggerCard: {
		backgroundColor: "#FFF",
		borderRadius: 12,
		padding: 20,
		marginBottom: 15,
		borderWidth: 2,
		borderColor: "#E0E0E0",
		flexDirection: "row",
		alignItems: "center",
	},
	selectedCard: {
		borderColor: "#71A12F",
		backgroundColor: "#F8FCF3",
	},
	triggerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		marginVertical: 10,
	},
	triggerDescription: {
		fontSize: 14,
		color: "#666",
		textAlign: "left",
	},
	triggerTextContainer: {
		marginLeft: 15,
		flex: 1,
	},
	dropdown: {
		backgroundColor: "#F9F9F9",
		borderColor: "#E0E0E0",
		borderRadius: 8,
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
		color: "#333",
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
	icon: {
		marginRight: 5,
	},
	label: {
		fontSize: 16,
		color: "#333",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "#F9F9F9",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		color: "#333",
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#E0E0E0",
	},
	datePickerButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9F9F9",
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#E0E0E0",
	},
	datePickerText: {
		marginLeft: 10,
		fontSize: 16,
		color: "#333",
	},
	navigationContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	nextButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#71A12F",
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 8,
		justifyContent: "center",
		flex: 1,
		marginHorizontal: 5,
	},
	nextButtonText: {
		color: "#FFF",
		fontSize: 16,
		marginRight: 5,
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#757575",
		borderRadius: 8,
		flex: 1,
		marginHorizontal: 5,
		justifyContent: "center",
	},
	backButtonText: {
		color: "white",
		fontSize: 16,
		marginLeft: 5,
	},
	submitButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#71A12F",
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignSelf: "center",
		marginTop: 10,
	},
	submitButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},
	actionItem: {
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#E0E0E0",
		borderRadius: 8,
		padding: 15,
		backgroundColor: "#F9F9F9",
	},
	subSectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
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
		backgroundColor: "#71A12F",
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 8,
		alignSelf: "flex-start",
		marginTop: 10,
	},
	addButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},
	errorText: {
		color: "#F44336",
		fontSize: 16,
		marginBottom: 10,
	},
	infoText: {
		color: "#555",
		fontSize: 16,
		textAlign: "center",
		marginVertical: 10,
	},
	retryText: {
		color: "#71A12F",
		fontSize: 16,
		textAlign: "center",
		marginTop: 10,
		textDecorationLine: "underline",
	},
	// Updated Styles for Vertical ScrollView
	deviceScrollContainer: {
		maxHeight: 250, // Adjusted max height for vertical scrolling
		marginBottom: 15,
	},
	deviceScrollContent: {
		paddingVertical: 10,
		paddingHorizontal: 10,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		padding: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
		marginBottom: 10, // Spacing between cards in vertical ScrollView
	},
	selectedCard: {
		borderColor: "#71A12F",
		borderWidth: 2,
		backgroundColor: "#F0FFF4",
	},
	deviceInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	deviceImage: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#E0E0E0",
		marginRight: 10,
	},
	placeholderImage: {
		backgroundColor: "#BDBDBD",
		justifyContent: "center",
		alignItems: "center",
	},
	deviceTextContainer: {
		flex: 1,
	},
	deviceName: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#333",
	},
	statusContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
	},
	deviceStatus: {
		fontSize: 12,
		marginLeft: 4,
	},
});
