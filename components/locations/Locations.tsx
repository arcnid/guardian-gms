// LocationsList.js

import React, { useState, useEffect, memo } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Platform,
	UIManager,
	TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { binService } from "@/services/bins/service"; // <-- Import your bin service

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
	/**
	 * Converts Celsius to Fahrenheit.
	 *
	 * @param {number} celsius - The temperature in Celsius.
	 * @returns {number} The converted temperature in Fahrenheit.
	 */
	getCtoF: (celsius) => (celsius * 9) / 5 + 32,
	/**
	 * Converts Fahrenheit to Celsius.
	 *
	 * @param {number} fahrenheit - The temperature in Fahrenheit.
	 * @returns {number} The converted temperature in Celsius.
	 */
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
					(site.bins || []).map((bin) =>
						bin.devices.find((dev) => dev.id === selectedDevice)
							? {
									siteId: site.id,
									siteName: site.name,
									binId: bin.id,
									binName: bin.name,
									device: bin.devices.find((dev) => dev.id === selectedDevice),
								}
							: null
					)
				)
				.filter(Boolean)[0];
			setSelectedDeviceInfo(deviceDetails);
		} else {
			setSelectedDeviceInfo(null);
		}
	}, [selectedDevice, data]);

	const toggleSite = (siteId) => {
		// Simply toggle the expansion state.
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
	// Determine if this site has bins.
	const hasBins = site.bins && site.bins.length > 0;

	// --- For Regular View Only (not selectable) ---
	// We'll show a plus button in the header to add bins.
	const [isAddingBin, setIsAddingBin] = useState(false);
	const [newBinName, setNewBinName] = useState("");

	const handleAddBin = async () => {
		if (!newBinName.trim()) return;
		try {
			// Call your BinService to add the new bin.
			const newBin = await BinService.addBin(site.id, newBinName.trim());
			// Update the site bins. (Note: This example mutates the site object; in a real-world
			// scenario, you might trigger a refresh or use a callback to update parent state.)
			if (site.bins) {
				site.bins.push(newBin);
			} else {
				site.bins = [newBin];
			}
			setIsAddingBin(false);
			setNewBinName("");
		} catch (error) {
			console.error("Error adding bin:", error);
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
								(acc, b) => acc + (b.devices ? b.devices.length : 0),
								0
							)}{" "}
							Device
							{(site.bins || []).reduce(
								(acc, b) => acc + (b.devices ? b.devices.length : 0),
								0
							) !== 1
								? "s"
								: ""}
						</Text>
					</View>
				</View>
				{/* In regular view only (selectable===false), render the add (+) button */}
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
			{/* If the location is expanded and has bins, render the bin cards */}
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
							/>
						);
					})}
				</View>
			)}
			{!hasBins && (
				<View style={{ marginTop: 12 }}>
					<Text style={styles.noDataText}>No bins for this location.</Text>
				</View>
			)}
			{/* Render the "Add Bin" form if the user clicked the plus button (only in regular view) */}
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
}) {
	const hasDevices = bin.devices && bin.devices.length > 0;

	return (
		<View style={styles.binCard}>
			<TouchableOpacity
				style={styles.binHeader}
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
							{bin.devices ? bin.devices.length : 0} Device
							{(bin.devices ? bin.devices.length : 0) !== 1 ? "s" : ""}
						</Text>
					</View>
				</View>
				{hasDevices && (
					<MaterialIcons
						name={expanded ? "expand-less" : "expand-more"}
						size={24}
						color={Colors.primary}
					/>
				)}
			</TouchableOpacity>
			{expanded && hasDevices && (
				<View style={styles.deviceList}>
					{bin.devices
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
							/>
						))}
				</View>
			)}
			{!hasDevices && (
				<View style={{ marginTop: 8 }}>
					<Text style={styles.noDataText}>No devices in this bin.</Text>
				</View>
			)}
		</View>
	);
});

const DeviceItem = memo(function DeviceItem({
	device,
	siteId,
	binId,
	selectable,
	selectedDevice,
	onDeviceSelect,
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
				activeOpacity={0.7}
				style={[
					styles.deviceInnerContainer,
					!device.isOnline && styles.deviceOffline,
				]}
			>
				<View style={styles.deviceIconContainer}>{renderDeviceIcon()}</View>
				<View style={styles.deviceInfo}>
					<Text style={styles.deviceName}>{device.name}</Text>
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
	// New right-side container for the header that holds the add button and the expand toggle.
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
	// Styles for the add bin button in the site header.
	addBinButton: {
		marginRight: 8,
	},
	// Styles for the inline add bin form.
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
});

export default LocationsList;
