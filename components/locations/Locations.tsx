// LocationsList.js

import React, { useState, useRef, useEffect, memo } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	LayoutAnimation,
	Platform,
	UIManager,
} from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	interpolate,
	Extrapolate,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/** Enable LayoutAnimation on Android */
if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

// Optional timeAgo helper
function timeAgo(timestamp) {
	const now = new Date();
	const then = new Date(timestamp);
	const secondsPast = Math.floor((now - then) / 1000);
	if (secondsPast < 60) return `${secondsPast}s ago`;
	if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)}m ago`;
	if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)}h ago`;
	return `${Math.floor(secondsPast / 86400)}d ago`;
}

/** -----------------------------------------------------------------------
 * LocationsList (Reanimated Expand/Collapse)
 * -----------------------------------------------------------------------
 * Renders a list of site -> bin -> device, in a collapsible layout.
 * If `selectable` is true, tapping a device calls `onDeviceSelect(siteId, binId, deviceId)`.
 */
export function LocationsList({
	data,
	selectable = false,
	selectedDevice = undefined,
	onDeviceSelect,
}) {
	// 1) Early return if no data
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

	// Banner reanimated values
	const bannerOpacity = useSharedValue(0);
	const bannerTranslateY = useSharedValue(-20);

	// -----------------
	// HEIGHT TRANSITION
	// -----------------
	// We add a height animation only if `selectable === true`.
	// Container starts at 400 (expanded). If a device is selected => 120 (collapsed).
	const EXPANDED_HEIGHT = 400;
	const COLLAPSED_HEIGHT = 120;
	const containerHeight = useSharedValue(0);

	useEffect(() => {
		if (selectable) {
			// Initially expanded
			containerHeight.value = withTiming(EXPANDED_HEIGHT, { duration: 0 });
		}
	}, [selectable]);

	// If a device is selected => collapsed, else expanded
	useEffect(() => {
		if (!selectable) return; // no height transition if not selectable

		if (selectedDevice) {
			containerHeight.value = withTiming(COLLAPSED_HEIGHT, { duration: 300 });
		} else {
			containerHeight.value = withTiming(EXPANDED_HEIGHT, { duration: 300 });
		}
	}, [selectedDevice, selectable]);

	// Reanimated style for container
	const containerAnimatedStyle = useAnimatedStyle(() => {
		if (!selectable) return {};
		return {
			height: containerHeight.value,
			overflow: "hidden", // hide content beyond container's animated height
		};
	});

	// Whenever `selectedDevice` changes, find device details for banner
	useEffect(() => {
		if (selectedDevice) {
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
			setExpandedSites({});
			setExpandedBins({});

			// Find device info
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

			// Animate banner in
			bannerOpacity.value = withTiming(1, { duration: 300 });
			bannerTranslateY.value = withTiming(0, { duration: 300 });
		} else {
			// Animate banner out
			setSelectedDeviceInfo(null);
			bannerOpacity.value = withTiming(0, { duration: 300 });
			bannerTranslateY.value = withTiming(-20, { duration: 300 });
		}
	}, [selectedDevice, data, bannerOpacity, bannerTranslateY]);

	// Animated style for banner
	const bannerAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: bannerOpacity.value,
			transform: [{ translateY: bannerTranslateY.value }],
		};
	});

	/**
	 * If we are in "selectable" mode AND we have a selected device,
	 * we hide the entire list to save space, showing only an indicator.
	 */
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

	// Renders the banner if we want it in non-selectable mode or no device is selected
	const renderSelectedDeviceBanner = () => {
		if (!selectedDeviceInfo) return null;
		return (
			<Animated.View style={[styles.selectedDeviceBanner, bannerAnimatedStyle]}>
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
			</Animated.View>
		);
	};

	// Expand/collapse logic
	const toggleSite = (siteId) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setExpandedSites((prev) => ({ ...prev, [siteId]: !prev[siteId] }));
	};

	const toggleBin = (binId) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setExpandedBins((prev) => ({ ...prev, [binId]: !prev[binId] }));
	};

	// Render site item
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

	// Show banner (if any) + list
	return (
		<Animated.View
			style={[
				styles.container,
				selectable && styles.selectableContainer,
				containerAnimatedStyle,
			]}
		>
			{renderSelectedDeviceBanner()}
			<FlatList
				data={data}
				keyExtractor={(location) => String(location.id)}
				renderItem={renderSite}
				style={selectable && styles.selectableList}
				contentContainerStyle={styles.listContainer}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={21}
				removeClippedSubviews
				// Remove the following line to re-enable scrolling
				// scrollEnabled={false}
				// Instead, enable scrolling and allow it to scroll within its container
				scrollEnabled={true}
			/>
		</Animated.View>
	);
}

/** -----------------------------------------------------------------------
 * SiteCard
 * ----------------------------------------------------------------------- */
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

	const rotateAnim = useSharedValue(expanded ? 1 : 0);
	const scaleAnim = useSharedValue(1);

	useEffect(() => {
		rotateAnim.value = withTiming(expanded ? 1 : 0, { duration: 200 });
	}, [expanded]);

	const rotateStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					rotate: `${interpolate(
						rotateAnim.value,
						[0, 1],
						[0, 180],
						Extrapolate.CLAMP
					)}deg`,
				},
			],
		};
	});

	const scaleStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scaleAnim.value }],
		};
	});

	function onPressIn() {
		scaleAnim.value = withTiming(0.97, { duration: 100 });
	}
	function onPressOut() {
		scaleAnim.value = withTiming(1, { duration: 100 });
	}

	return (
		<Animated.View style={[styles.card, scaleStyle]}>
			<TouchableOpacity
				style={styles.cardHeader}
				onPress={hasBins ? toggleExpand : undefined}
				activeOpacity={hasBins ? 0.7 : 1}
				onPressIn={hasBins ? onPressIn : undefined}
				onPressOut={hasBins ? onPressOut : undefined}
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
							{(site.bins && site.bins.length) || 0} Bin
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
				{hasBins && (
					<Animated.View style={rotateStyle}>
						<MaterialIcons
							name="expand-more"
							size={24}
							color={Colors.primary}
						/>
					</Animated.View>
				)}
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
		</Animated.View>
	);
});

/** -----------------------------------------------------------------------
 * BinCard
 * ----------------------------------------------------------------------- */
export const BinCard = memo(function BinCard({
	bin,
	siteId,
	expanded,
	toggleExpand,
	selectable,
	selectedDevice,
	onDeviceSelect,
}) {
	const rotateAnim = useSharedValue(expanded ? 1 : 0);
	const fadeAnim = useSharedValue(expanded ? 1 : 0);
	const scaleAnim = useSharedValue(1);

	useEffect(() => {
		rotateAnim.value = withTiming(expanded ? 1 : 0, { duration: 200 });
		fadeAnim.value = withTiming(expanded ? 1 : 0, { duration: 300 });
	}, [expanded]);

	const rotateStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					rotate: `${interpolate(
						rotateAnim.value,
						[0, 1],
						[0, 180],
						Extrapolate.CLAMP
					)}deg`,
				},
			],
		};
	});

	const fadeStyle = useAnimatedStyle(() => {
		return {
			opacity: fadeAnim.value,
		};
	});

	const scaleStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: scaleAnim.value }],
		};
	});

	function onPressIn() {
		scaleAnim.value = withTiming(0.97, { duration: 100 });
	}
	function onPressOut() {
		scaleAnim.value = withTiming(1, { duration: 100 });
	}

	const hasDevices = bin.devices && bin.devices.length > 0;

	if (Platform.OS === "android") {
		return (
			<View style={styles.binCard}>
				<TouchableOpacity
					style={styles.binHeader}
					onPress={hasDevices ? toggleExpand : undefined}
					activeOpacity={hasDevices ? 0.7 : 1}
					accessibilityLabel={`Toggle ${bin.name} Devices`}
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
								{bin.devices?.length ?? 0} Device
								{(bin.devices?.length ?? 0) !== 1 ? "s" : ""}
							</Text>
						</View>
					</View>
					{hasDevices && (
						<MaterialIcons
							name={expanded ? "expand-less" : "expand-more"}
							size={24}
							color={Colors.primary}
							accessibilityLabel={
								expanded ? "Collapse Devices" : "Expand Devices"
							}
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
	}

	return (
		<Animated.View style={[styles.binCard, scaleStyle]}>
			<TouchableOpacity
				style={styles.binHeader}
				onPress={hasDevices ? toggleExpand : undefined}
				activeOpacity={hasDevices ? 0.7 : 1}
				onPressIn={hasDevices ? onPressIn : undefined}
				onPressOut={hasDevices ? onPressOut : undefined}
			>
				<View style={styles.binHeaderLeft}>
					<MaterialIcons
						name="storage"
						size={24}
						color={Colors.primary}
						style={styles.binIcon}
					/>
					<View>
						<Text style={styles.binTitle}>{bin.name}</Text>
						<Text style={styles.binSubtitle}>
							{bin.devices?.length ?? 0} Device
							{(bin.devices?.length ?? 0) !== 1 ? "s" : ""}
						</Text>
					</View>
				</View>
				{hasDevices && (
					<Animated.View style={rotateStyle}>
						<MaterialIcons
							name="expand-more"
							size={24}
							color={Colors.primary}
						/>
					</Animated.View>
				)}
			</TouchableOpacity>

			{expanded && hasDevices && (
				<Animated.View style={[styles.deviceList, fadeStyle]}>
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
				</Animated.View>
			)}

			{!hasDevices && (
				<View style={{ marginTop: 8 }}>
					<Text style={styles.noDataText}>No devices in this bin.</Text>
				</View>
			)}
		</Animated.View>
	);
});

/** -----------------------------------------------------------------------
 * DeviceItem
 * ----------------------------------------------------------------------- */
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

	// Reanimated shared values
	const opacity = useSharedValue(1);
	const scale = useSharedValue(1);
	const bgColor = useSharedValue(0); // 0 = unselected, 1 = selected

	useEffect(() => {
		if (isSelected) {
			opacity.value = withTiming(0.8, { duration: 300 });
			scale.value = withTiming(0.95, { duration: 300 });
			bgColor.value = withTiming(1, { duration: 300 });
		} else {
			opacity.value = withTiming(1, { duration: 300 });
			scale.value = withTiming(1, { duration: 300 });
			bgColor.value = withTiming(0, { duration: 300 });
		}
	}, [isSelected]);

	// Animated styles
	const animatedStyle = useAnimatedStyle(() => {
		const backgroundColor = interpolate(
			bgColor.value,
			[0, 1],
			[Colors.cardBackground, Colors.selectedBackground],
			Extrapolate.CLAMP
		);
		return {
			opacity: opacity.value,
			transform: [{ scale: scale.value }],
			backgroundColor,
		};
	});

	const handlePress = () => {
		if (selectable && onDeviceSelect) {
			onDeviceSelect(siteId, binId, device.id);
		} else {
			router.push(`/devices/${device.id}`);
		}
	};

	function renderDeviceIcon() {
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
	}

	function renderMetrics() {
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
								? `${device.temperature}°C`
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
	}

	function renderStatusIcon() {
		return device.isOnline ? (
			<MaterialIcons name="wifi" size={20} color={Colors.powerOn} />
		) : (
			<MaterialIcons name="wifi-off" size={20} color={Colors.powerOff} />
		);
	}

	return (
		<Animated.View style={[styles.deviceContainer, animatedStyle]}>
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
		</Animated.View>
	);
});

/** -----------------------------------------------------------------------
 * Styles
 * ----------------------------------------------------------------------- */
const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	// We keep maxHeight: 400 for selectable mode, but we also animate the height.
	selectableContainer: {
		maxHeight: 400, // keeps the scroll as you had
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
});
