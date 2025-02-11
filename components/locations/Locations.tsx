// LocationsList.js

import React, { useState, useEffect, memo, useContext } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Platform,
	UIManager,
	TextInput,
	Modal,
	Alert, // <-- For confirmation dialogs
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { binService } from "@/services/bins/service"; // <-- Import your bin service
import { AuthContext } from "@/contexts/AuthContext"; // <-- Import AuthContext to get userId

// (Optional) Enable LayoutAnimation on Android if you plan to use simple layout changes.
if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Metric Service to convert temperatures between Celsius and Fahrenheit.
 */
const metricService = {
	getCtoF: (celsius) => (celsius * 9) / 5 + 32,
	getFtoC: (fahrenheit) => ((fahrenheit - 32) * 5) / 9,
};

/** THEME & HELPERS */
const Colors = {
	primary: "#71A12F",
	cardBackground: "#FFFFFF",
	textPrimary: "#333333",
	textMuted: "#777777",
	iconInactive: "#888888",
	powerOn: "#4CAF50",
	powerOff: "#F44336",
	sensorTemp: "#FF5722",
	sensorHumidity: "#2196F3",
	selectedBackground: "#F0FFF4",
	selectedBannerBackground: "#ECF9E6",
};

const Fonts = {
	subHeader: { fontSize: 20, fontWeight: "600" },
	body: { fontSize: 16, fontWeight: "500" },
	caption: { fontSize: 12, fontWeight: "400" },
};

/**
 * LocationsList renders a list of sites. Each site can contain bins, and each bin can contain devices.
 * If `selectable` is true, tapping a device calls onDeviceSelect(siteId, binId, deviceId).
 */
export function LocationsList({
	data,
	selectable = false,
	selectedDevice = undefined,
	onDeviceSelect,
}) {
	console.log("data", data);
	if (!data || data.length === 0) {
		return (
			<View style={styles.noDataContainer}>
				<Text style={styles.noDataText}>No locations available.</Text>
			</View>
		);
	}

	const [expandedSites, setExpandedSites] = useState({});
	const [expandedBins, setExpandedBins] = useState({});
	const [selectedDeviceInfo, setSelectedDeviceInfo] = useState(null);

	// When a device is selected, find its details for the banner.
	useEffect(() => {
		if (selectedDevice) {
			// Reset the expanded states.
			setExpandedSites({});
			setExpandedBins({});
			// Look for the device in the data.
			const deviceDetails = data
				.flatMap((site) =>
					(site.bins || []).map((bin) => {
						const devices = bin?.devices || [];
						const device = devices.find((dev) => dev.id === selectedDevice);
						return device
							? {
									siteId: site.id,
									siteName: site.name,
									binId: bin.id,
									binName: bin.name,
									device,
								}
							: null;
					})
				)
				.filter(Boolean)[0];
			setSelectedDeviceInfo(deviceDetails);
		} else {
			setSelectedDeviceInfo(null);
		}
	}, [selectedDevice, data]);

	const toggleSite = (siteId) => {
		setExpandedSites((prev) => ({ ...prev, [siteId]: !prev[siteId] }));
	};

	const toggleBin = (binId) => {
		setExpandedBins((prev) => ({ ...prev, [binId]: !prev[binId] }));
	};

	const renderSite = ({ item: site }) => {
		const expanded = !!expandedSites[site.id];
		return (
			<SiteCard
				site={site}
				expanded={expanded}
				toggleExpand={() => toggleSite(site.id)}
				expandedBins={expandedBins}
				toggleBin={toggleBin}
				selectable={selectable}
				selectedDevice={selectedDevice}
				onDeviceSelect={onDeviceSelect}
			/>
		);
	};

	// If in selectable mode and a device is selected, show an indicator/banner instead of the list.
	if (selectable && selectedDeviceInfo) {
		return (
			<View style={styles.selectedIndicatorContainer}>
				<MaterialIcons
					name="check-circle"
					size={24}
					color={Colors.primary}
					style={{ marginRight: 12 }}
				/>
				<View style={{ flex: 1 }}>
					<Text style={styles.selectedIndicatorTitle}>
						{selectedDeviceInfo.device.name}
					</Text>
					<Text style={styles.selectedIndicatorSubtitle}>
						{selectedDeviceInfo.siteName} - {selectedDeviceInfo.binName}
					</Text>
				</View>
				<TouchableOpacity
					onPress={() => onDeviceSelect?.(null, null, null)}
					style={styles.deselectButton}
				>
					<MaterialIcons name="close" size={20} color={Colors.textMuted} />
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{selectedDeviceInfo &&
				renderSelectedDeviceBanner(selectedDeviceInfo, onDeviceSelect)}
			<FlatList
				data={data}
				keyExtractor={(location) => String(location.id)}
				renderItem={renderSite}
				scrollEnabled={false}
				contentContainerStyle={styles.listContainer}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
			/>
		</View>
	);
}

function renderSelectedDeviceBanner(selectedDeviceInfo, onDeviceSelect) {
	return (
		<View style={styles.selectedDeviceBanner}>
			<MaterialIcons
				name="check-circle"
				size={24}
				color={Colors.primary}
				style={{ marginRight: 8 }}
			/>
			<View style={{ flex: 1 }}>
				<Text style={[styles.selectedDeviceText, { fontWeight: "600" }]}>
					{selectedDeviceInfo.device.name}
				</Text>
				<Text style={styles.selectedDeviceSubText}>
					{selectedDeviceInfo.siteName} - {selectedDeviceInfo.binName}
				</Text>
			</View>
			<TouchableOpacity
				onPress={() => onDeviceSelect?.(null, null, null)}
				style={styles.deselectButton}
			>
				<MaterialIcons name="close" size={20} color={Colors.textMuted} />
			</TouchableOpacity>
		</View>
	);
}

const SiteCard = memo(function SiteCard({
	site,
	expanded,
	toggleExpand,
	expandedBins,
	toggleBin,
	selectable,
	selectedDevice,
	onDeviceSelect,
}) {
	const hasBins = site.bins && site.bins.length > 0;
	const [isAddingBin, setIsAddingBin] = useState(false);
	const [newBinName, setNewBinName] = useState("");
	const [refresh, setRefresh] = useState(0);

	const handleAddBin = async () => {
		if (!newBinName.trim()) return;
		try {
			const newBin = await binService.createBin(site.id, newBinName.trim());
			if (site.bins) {
				site.bins.push(newBin);
			} else {
				site.bins = [newBin];
			}
			setIsAddingBin(false);
			setNewBinName("");
			setRefresh((r) => r + 1);
		} catch (error) {
			console.error("Error adding bin:", error);
		}
	};

	const handleDeleteBin = async (binId) => {
		try {
			await binService.deleteBin(binId);
			if (site.bins) {
				site.bins = site.bins.filter((b) => b.id !== binId);
			}
			setRefresh((r) => r + 1);
		} catch (error) {
			console.error("Error deleting bin:", error);
		}
	};

	return (
		<View style={styles.card}>
			<TouchableOpacity
				style={styles.cardHeader}
				onPress={hasBins ? toggleExpand : undefined}
				activeOpacity={hasBins ? 0.7 : 1}
			>
				<View style={styles.cardHeaderLeft}>
					<MaterialIcons
						name="location-city"
						size={28}
						color={Colors.primary}
						style={styles.siteIcon}
					/>
					<View>
						<Text style={styles.cardTitle}>{site.name}</Text>
						<Text style={styles.cardSubtitle}>
							{site.bins ? site.bins.length : 0} Bin
							{!site.bins || site.bins.length !== 1 ? "s" : ""},{" "}
							{(site.bins || []).reduce(
								(acc, b) => acc + (b && b.devices ? b.devices.length : 0),
								0
							)}{" "}
							Device
							{(site.bins || []).reduce(
								(acc, b) => acc + (b && b.devices ? b.devices.length : 0),
								0
							) !== 1
								? "s"
								: ""}
						</Text>
					</View>
				</View>
				<View style={styles.cardHeaderRight}>
					{!selectable && (
						<TouchableOpacity
							onPress={() => setIsAddingBin(true)}
							style={styles.addBinButton}
						>
							<MaterialIcons name="add" size={24} color={Colors.primary} />
						</TouchableOpacity>
					)}
					{hasBins && (
						<MaterialIcons
							name={expanded ? "expand-less" : "expand-more"}
							size={24}
							color={Colors.primary}
						/>
					)}
				</View>
			</TouchableOpacity>
			{expanded && hasBins && (
				<View style={styles.cardContent}>
					{site.bins.map((bin) => {
						if (!bin?.id) return null;
						const binExpanded = !!expandedBins[bin.id];
						return (
							<BinCard
								key={String(bin.id)}
								bin={bin}
								siteId={site.id}
								expanded={binExpanded}
								toggleExpand={() => toggleBin(bin.id)}
								selectable={selectable}
								selectedDevice={selectedDevice}
								onDeviceSelect={onDeviceSelect}
								onDeleteBin={() => handleDeleteBin(bin.id)}
							/>
						);
					})}
				</View>
			)}
			{(!hasBins || site.bins.length === 0) && (
				<View style={{ marginTop: 12 }}>
					<Text style={styles.noDataText}>No bins for this location.</Text>
				</View>
			)}
			{!selectable && isAddingBin && (
				<View style={styles.addBinFormContainer}>
					<TextInput
						style={styles.addBinFormInput}
						placeholder="Enter bin name"
						value={newBinName}
						onChangeText={setNewBinName}
					/>
					<TouchableOpacity onPress={handleAddBin}>
						<MaterialIcons name="check" size={24} color={Colors.primary} />
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => {
							setIsAddingBin(false);
							setNewBinName("");
						}}
					>
						<MaterialIcons name="close" size={24} color={Colors.textMuted} />
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
});

export const BinCard = memo(function BinCard({
	bin,
	siteId,
	expanded,
	toggleExpand,
	selectable,
	selectedDevice,
	onDeviceSelect,
	onDeleteBin,
}) {
	const hasDevices = bin?.devices && bin?.devices.length > 0;
	const router = useRouter();
	const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
	const [availableDevices, setAvailableDevices] = useState([]);
	const { userId } = useContext(AuthContext);
	const [refresh, setRefresh] = useState(0);

	useEffect(() => {
		if (userId) {
			binService
				.getUserDevicesWithoutABin(userId)
				.then((devices) => {
					console.log("Devices without a bin:", devices);
					setAvailableDevices(devices);
				})
				.catch((error) =>
					console.error("Error fetching devices without a bin:", error)
				);
		}
	}, [userId, refresh]);

	// Updated: Call the bin service to add the device to the bin.
	const handleAddDeviceToBin = async (device) => {
		console.log(`Adding device ${device.device_name} to bin ${bin.id}`);
		try {
			await binService.addDeviceToBin(device.id, bin.id);
			// Optionally, update the local bin devices:
			if (!bin.devices) {
				bin.devices = [];
			}
			bin.devices.push(device);
			setRefresh((r) => r + 1);
			setShowAddDeviceModal(false);
		} catch (error) {
			console.error("Error adding device to bin:", error);
		}
	};

	// Function to remove a device from the bin.
	const handleRemoveDevice = (deviceId) => {
		Alert.alert(
			"Remove Device",
			"Do you want to remove this device from the bin?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: async () => {
						try {
							await binService.removeDeviceFromBin(bin.id, deviceId);
							bin.devices = bin.devices.filter((d) => d.id !== deviceId);
							setRefresh((r) => r + 1);
						} catch (error) {
							console.error("Error removing device:", error);
						}
					},
				},
			],
			{ cancelable: true }
		);
	};

	return (
		<>
			<View style={styles.binCard}>
				<View style={styles.binHeader}>
					<TouchableOpacity
						style={{ flex: 1 }}
						onPress={hasDevices ? toggleExpand : undefined}
						activeOpacity={hasDevices ? 0.7 : 1}
					>
						<View style={styles.binHeaderLeft}>
							<MaterialIcons
								name="storage"
								size={24}
								color={Colors.primary}
								style={styles.binIcon}
							/>
							<View>
								<Text style={styles.binTitle}>{bin.name || "Unnamed Bin"}</Text>
								<Text style={styles.binSubtitle}>
									{bin?.devices ? bin?.devices.length : 0} Device
									{(bin?.devices ? bin?.devices.length : 0) !== 1 ? "s" : ""}
								</Text>
							</View>
						</View>
					</TouchableOpacity>
					<View style={styles.binHeaderActions}>
						{hasDevices && (
							<MaterialIcons
								name={expanded ? "expand-less" : "expand-more"}
								size={24}
								color={Colors.primary}
							/>
						)}
						{/* Add Device button */}
						<TouchableOpacity
							onPress={() => setShowAddDeviceModal(true)}
							style={styles.addDeviceButton}
						>
							<MaterialIcons name="add" size={24} color={Colors.primary} />
						</TouchableOpacity>
						{onDeleteBin && (
							<TouchableOpacity
								onPress={onDeleteBin}
								style={styles.deleteBinButton}
							>
								<MaterialIcons name="delete" size={20} color="red" />
							</TouchableOpacity>
						)}
					</View>
				</View>
				{expanded && hasDevices && (
					<View style={styles.deviceList}>
						{bin?.devices
							.filter((d) => d && d.id)
							.map((device) => (
								<DeviceItem
									key={String(device.id)}
									device={device}
									siteId={siteId}
									binId={bin.id}
									selectable={selectable}
									selectedDevice={selectedDevice}
									onDeviceSelect={onDeviceSelect}
									onRemoveDevice={handleRemoveDevice} // Pass removal callback
								/>
							))}
					</View>
				)}
				{(!hasDevices || bin.devices.length === 0) && (
					<View style={{ marginTop: 8 }}>
						<Text style={styles.noDataText}>No devices in this bin.</Text>
					</View>
				)}
			</View>

			{/* ─── Modal for adding a device, sliding up from the bottom ───────────────── */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={showAddDeviceModal}
				onRequestClose={() => setShowAddDeviceModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Add Device</Text>
							<TouchableOpacity onPress={() => setShowAddDeviceModal(false)}>
								<MaterialIcons
									name="close"
									size={24}
									color={Colors.textMuted}
								/>
							</TouchableOpacity>
						</View>
						<View style={styles.modalContent}>
							<FlatList
								data={availableDevices}
								keyExtractor={(item) => item.id.toString()}
								renderItem={({ item }) => (
									<TouchableOpacity
										onPress={() => handleAddDeviceToBin(item)}
										style={styles.modalItem}
									>
										<Text style={styles.modalItemText}>{item.device_name}</Text>
									</TouchableOpacity>
								)}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
});

const DeviceItem = memo(function DeviceItem({
	device,
	siteId,
	binId,
	selectable,
	selectedDevice,
	onDeviceSelect,
	onRemoveDevice, // Removal callback
}) {
	const router = useRouter();
	const isSelected = selectedDevice === device.id;

	const handlePress = () => {
		if (selectable && onDeviceSelect) {
			onDeviceSelect(siteId, binId, device.id);
		} else {
			router.push(`/devices/${device.id}`);
		}
	};

	// On long press, prompt for removal.
	const handleLongPress = () => {
		if (onRemoveDevice) {
			Alert.alert(
				"Remove Device",
				"Do you want to remove this device from the bin?",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Remove",
						style: "destructive",
						onPress: () => onRemoveDevice(device.id),
					},
				],
				{ cancelable: true }
			);
		}
	};

	const renderDeviceIcon = () => {
		if (device.type === "relay" || device.type === "control-box") {
			return device.isOnline ? (
				<MaterialIcons name="power" size={24} color={Colors.powerOn} />
			) : (
				<MaterialIcons name="power-off" size={24} color={Colors.powerOff} />
			);
		} else if (device.type === "sensor") {
			return (
				<MaterialIcons name="sensors" size={24} color={Colors.sensorTemp} />
			);
		}
		return null;
	};

	const renderMetrics = () => {
		if (device.type === "sensor") {
			return (
				<View style={styles.metricsContainerInline}>
					<View style={styles.metricItemInline}>
						<MaterialIcons
							name="thermostat"
							size={16}
							color={Colors.sensorTemp}
						/>
						<Text style={styles.metricText}>
							{device.temperature !== undefined
								? `${device.temperature}°C (${metricService
										.getCtoF(device.temperature)
										.toFixed(1)}°F)`
								: "N/A"}
						</Text>
					</View>
					<View style={styles.metricItemInline}>
						<MaterialIcons
							name="water-drop"
							size={16}
							color={Colors.sensorHumidity}
						/>
						<Text style={styles.metricText}>
							{device.humidity !== undefined ? `${device.humidity}%` : "N/A"}
						</Text>
					</View>
				</View>
			);
		}
		return null;
	};

	const renderStatusIcon = () => {
		return device.isOnline ? (
			<MaterialIcons name="wifi" size={20} color={Colors.powerOn} />
		) : (
			<MaterialIcons name="wifi-off" size={20} color={Colors.powerOff} />
		);
	};

	return (
		<View style={styles.deviceContainer}>
			<TouchableOpacity
				onPress={handlePress}
				onLongPress={handleLongPress} // <-- Added long press for removal prompt
				activeOpacity={0.7}
				style={[
					styles.deviceInnerContainer,
					!device.isOnline && styles.deviceOffline,
				]}
			>
				<View style={styles.deviceIconContainer}>{renderDeviceIcon()}</View>
				<View style={styles.deviceInfo}>
					<Text style={styles.deviceName}>
						{device.name || device.device_name}
					</Text>
					<View style={styles.statusAndMetrics}>
						{renderStatusIcon()}
						{renderMetrics()}
					</View>
				</View>
				{selectable ? (
					isSelected ? (
						<MaterialIcons
							name="check-circle"
							size={24}
							color={Colors.primary}
						/>
					) : (
						<MaterialIcons
							name="radio-button-unchecked"
							size={24}
							color={Colors.iconInactive}
						/>
					)
				) : (
					<MaterialIcons
						name="chevron-right"
						size={24}
						color={Colors.iconInactive}
					/>
				)}
			</TouchableOpacity>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	selectableContainer: {
		maxHeight: 400,
	},
	selectedIndicatorContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.selectedBannerBackground,
		padding: 16,
		borderRadius: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	selectedIndicatorTitle: {
		fontSize: Fonts.body.fontSize,
		fontWeight: "600",
		color: Colors.textPrimary,
	},
	selectedIndicatorSubtitle: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textMuted,
		marginTop: 2,
	},
	selectedDeviceBanner: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.selectedBannerBackground,
		padding: 20,
		borderRadius: 8,
		marginTop: 10,
		marginBottom: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	selectedDeviceText: {
		flex: 1,
		fontSize: Fonts.body.fontSize,
		color: Colors.textPrimary,
	},
	selectedDeviceSubText: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textMuted,
	},
	deselectButton: {
		padding: 4,
	},
	listContainer: {
		padding: 0,
	},
	separator: {
		height: 16,
	},
	noDataContainer: {
		alignItems: "center",
		justifyContent: "center",
		padding: 16,
	},
	noDataText: {
		fontSize: Fonts.body.fontSize,
		color: Colors.textMuted,
	},
	card: {
		backgroundColor: Colors.cardBackground,
		borderRadius: 12,
		padding: 20,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cardHeaderLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	cardHeaderRight: {
		flexDirection: "row",
		alignItems: "center",
	},
	siteIcon: {
		marginRight: 10,
	},
	cardTitle: {
		fontSize: Fonts.subHeader.fontSize,
		fontWeight: Fonts.subHeader.fontWeight,
		color: Colors.textPrimary,
	},
	cardSubtitle: {
		fontSize: Fonts.body.fontSize - 2,
		color: Colors.textMuted,
		marginTop: 4,
	},
	cardContent: {
		marginTop: 12,
	},
	binCard: {
		marginTop: 12,
		paddingLeft: 12,
		borderLeftWidth: 2,
		borderLeftColor: Colors.primary,
	},
	binHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	binHeaderLeft: {
		flexDirection: "row",
		alignItems: "center",
	},
	binHeaderActions: {
		flexDirection: "row",
		alignItems: "center",
	},
	binIcon: {
		marginRight: 10,
	},
	binTitle: {
		fontSize: Fonts.body.fontSize,
		fontWeight: "500",
		color: Colors.textPrimary,
	},
	binSubtitle: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textMuted,
		marginTop: 2,
	},
	deviceList: {
		marginLeft: 16,
		marginTop: 6,
	},
	deviceContainer: {
		marginBottom: 12,
	},
	deviceInnerContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.cardBackground,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: Colors.iconInactive,
	},
	deviceOffline: {
		opacity: 0.6,
	},
	deviceIconContainer: {
		marginRight: 12,
		width: 32,
		alignItems: "center",
	},
	deviceInfo: {
		flex: 1,
	},
	deviceName: {
		fontSize: Fonts.body.fontSize,
		fontWeight: "500",
		color: Colors.textPrimary,
		marginBottom: 4,
	},
	statusAndMetrics: {
		flexDirection: "row",
		alignItems: "center",
	},
	metricsContainerInline: {
		flexDirection: "row",
		marginLeft: 8,
	},
	metricItemInline: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: 12,
	},
	metricText: {
		fontSize: Fonts.caption.fontSize,
		color: Colors.textMuted,
		marginLeft: 4,
	},
	addBinButton: {
		marginRight: 8,
	},
	addBinFormContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
	},
	addBinFormInput: {
		flex: 1,
		borderWidth: 1,
		borderColor: Colors.iconInactive,
		borderRadius: 4,
		padding: 8,
		marginRight: 8,
	},
	deleteBinButton: {
		marginLeft: 8,
		padding: 4,
	},
	// New styles for modal and Add Device button
	addDeviceButton: {
		marginLeft: 8,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	modalContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		maxHeight: "80%",
		backgroundColor: Colors.cardBackground,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 10,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	modalTitle: {
		fontSize: Fonts.subHeader.fontSize,
		fontWeight: Fonts.subHeader.fontWeight,
		color: Colors.textPrimary,
	},
	modalContent: {
		flex: 1,
		marginTop: 10,
	},
	modalItem: {
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: Colors.iconInactive,
	},
	modalItemText: {
		fontSize: Fonts.body.fontSize,
		color: Colors.textPrimary,
	},
});

export default LocationsList;
