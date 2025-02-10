// CustomMapView.native.js
import React, { useRef, useEffect } from "react";
import { StyleSheet, Platform, Dimensions } from "react-native";
import MapView, { Marker, UrlTile, PROVIDER_GOOGLE } from "react-native-maps";
import PropTypes from "prop-types";

const CustomMapView = ({
	onMarkerPress,
	data,
	coordinate,
	draggableMarker,
	onMarkerDragEnd,
}) => {
	const mapRef = useRef(null);

	// If a coordinate prop is provided, render a single marker and center the map on it.
	if (coordinate) {
		const region = {
			latitude: coordinate.latitude,
			longitude: coordinate.longitude,
			// Use a closer zoom for location selection
			latitudeDelta: 0.05,
			longitudeDelta: 0.05,
		};

		// When the coordinate changes, animate the map to the new region.
		useEffect(() => {
			if (mapRef.current) {
				mapRef.current.animateToRegion(region, 500);
			}
		}, [coordinate]);

		return (
			<MapView
				ref={mapRef}
				style={styles.mapContainer}
				initialRegion={region}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
			>
				{Platform.OS === "android" && (
					<UrlTile
						urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
						maximumZ={19}
						minimumZ={0}
					/>
				)}
				<Marker
					coordinate={{
						latitude: region.latitude,
						longitude: region.longitude,
					}}
					draggable={!!draggableMarker}
					onDragEnd={(e) => {
						if (draggableMarker && onMarkerDragEnd) {
							onMarkerDragEnd(e);
						}
					}}
				/>
			</MapView>
		);
	}

	// Otherwise, fallback to existing functionality using the data prop.
	const initialRegion = {
		latitude: data[0]?.latitude || 43.509,
		longitude: data[0]?.longitude || -96.9568,
		latitudeDelta: 0.5,
		longitudeDelta: 0.5,
	};

	return (
		<MapView
			style={styles.mapContainer}
			initialRegion={initialRegion}
			provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
		>
			{Platform.OS === "android" && (
				<UrlTile
					urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
					maximumZ={19}
					minimumZ={0}
				/>
			)}
			{data.map((site) => (
				<Marker
					key={site.id}
					coordinate={{
						latitude: site.latitude,
						longitude: site.longitude,
					}}
					title={site.name}
					description={`${site.bins.length} Bin${
						site.bins.length > 1 ? "s" : ""
					}, ${site.bins.reduce((acc, bin) => acc + bin.devices.length, 0)} Device${
						site.bins.reduce((acc, bin) => acc + bin.devices.length, 0) > 1
							? "s"
							: ""
					}`}
					onPress={() => onMarkerPress(site)}
				/>
			))}
		</MapView>
	);
};

CustomMapView.propTypes = {
	onMarkerPress: PropTypes.func.isRequired,
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			user_id: PropTypes.string,
			created_at: PropTypes.string,
			name: PropTypes.string.isRequired,
			latitude: PropTypes.number.isRequired,
			longitude: PropTypes.number.isRequired,
			bins: PropTypes.arrayOf(
				PropTypes.shape({
					id: PropTypes.string.isRequired,
					created_at: PropTypes.string,
					name: PropTypes.string,
					location_id: PropTypes.string,
					devices: PropTypes.arrayOf(
						PropTypes.shape({
							id: PropTypes.string.isRequired,
							name: PropTypes.string,
							type: PropTypes.string,
							humidity: PropTypes.number,
							temperature: PropTypes.number,
							lastRead: PropTypes.string,
							isOnline: PropTypes.bool,
						})
					),
				})
			),
		})
	).isRequired,
	coordinate: PropTypes.shape({
		latitude: PropTypes.number.isRequired,
		longitude: PropTypes.number.isRequired,
	}),
	draggableMarker: PropTypes.bool,
	onMarkerDragEnd: PropTypes.func,
};

const styles = StyleSheet.create({
	mapContainer: {
		flex: 1,
		width: Dimensions.get("window").width,
		height: Dimensions.get("window").height,
	},
});

export default CustomMapView;
