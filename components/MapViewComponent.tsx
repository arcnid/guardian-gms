// MapViewComponent.js
import React from "react";
import { Platform } from "react-native";
import NativeMapView from "./NativeMapView";
import WebMapView from "./WebMapView";

const MapViewComponent = ({ sites, onMarkerPress }) => {
	if (Platform.OS === "web") {
		return <WebMapView sites={sites} onMarkerPress={onMarkerPress} />;
	} else {
		return <NativeMapView sites={sites} onMarkerPress={onMarkerPress} />;

export default MapViewComponent;
