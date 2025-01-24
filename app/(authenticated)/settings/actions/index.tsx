import React, { useEffect, useState, useContext } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	FlatList,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import BackButton from "../../../../components/BackButton";
import { AuthContext } from "@/contexts/AuthContext";
import { ActionService } from "@/services/actions/service";
import { useRouter } from "expo-router";

const ScheduledActions = () => {
	const { userId } = useContext(AuthContext); // Get user ID from AuthContext
	const [scheduledActions, setScheduledActions] = useState([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	// Fetch user's scheduled actions
	useEffect(() => {
		const fetchScheduledActions = async () => {
			try {
				const actions = await ActionService.getActionsForUser(userId);

				console.log("actions");

				if (!actions || actions == undefined)
					throw new Error("No actions found");

				setScheduledActions(actions);
			} catch (error) {
				console.error("Failed to fetch scheduled actions:", error);
				Alert.alert(
					"Error",
					"Unable to fetch scheduled actions. Please try again."
				);
			} finally {
				setLoading(false);
			}
		};
		fetchScheduledActions();
	}, [userId]);

	// Handle removing a scheduled action
	const handleRemoveScheduledAction = (actionId) => {
		Alert.alert(
			"Remove Scheduled Action",
			"Are you sure you want to remove this scheduled action?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					onPress: async () => {
						try {
							await ActionService.removeAction(actionId);
							setScheduledActions((prev) =>
								prev.filter((action) => action.id !== actionId)
							);
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

	// Placeholder for adding a new scheduled action
	const handleAddScheduledAction = () => {
		router.navigate({
			pathname: "/settings/actions/addAction",
			params: undefined,
		});
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.container}>
				{/* Reusable Back Button */}
				<BackButton label="Settings" />

				<Text style={styles.heading}>Scheduled Actions</Text>

				{/* Add Scheduled Action Button */}
				<TouchableOpacity
					style={styles.addButton}
					onPress={handleAddScheduledAction}
				>
					<MaterialIcons name="add" size={24} color="#FFF" />
					<Text style={styles.addButtonText}>Add Scheduled Action</Text>
				</TouchableOpacity>

				{/* Scheduled Actions List */}
				{loading ? (
					<Text style={styles.loadingText}>Loading scheduled actions...</Text>
				) : scheduledActions.length > 0 ? (
					<FlatList
						data={scheduledActions}
						keyExtractor={(item) => item.id.toString()}
						renderItem={({ item }) => (
							<View style={styles.card}>
								<View>
									<Text style={styles.cardTitle}>{item.name}</Text>
									<Text style={styles.cardContent}>
										When: {item.conditions.join(", ")}
									</Text>
									<Text style={styles.cardContent}>
										Do: {item.actions.join(", ")}
									</Text>
								</View>
								<TouchableOpacity
									onPress={() => handleRemoveScheduledAction(item.id)}
								>
									<MaterialIcons
										name="delete"
										size={24}
										color="#FF5722"
										style={styles.deleteIcon}
									/>
								</TouchableOpacity>
							</View>
						)}
					/>
				) : (
					<Text style={styles.noDataText}>
						No scheduled actions found. Start by adding one!
					</Text>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

export default ScheduledActions;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F5F5F5", // Matches container background
	},
	container: {
		flex: 1,
		padding: 16,
	},
	heading: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333", // Black heading text
		marginBottom: 16,
		textAlign: "center",
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#71A12F",
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	addButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333", // Black title text
		marginBottom: 8,
	},
	cardContent: {
		fontSize: 16,
		color: "#333", // Black card content
		marginBottom: 4,
	},
	deleteIcon: {
		marginLeft: 16,
	},
	loadingText: {
		textAlign: "center",
		fontSize: 16,
		color: "#999",
	},
	noDataText: {
		textAlign: "center",
		fontSize: 16,
		color: "#999",
	},
});
