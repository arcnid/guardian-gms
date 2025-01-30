import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import BackButton from "../../../../components/BackButton"; // Import BackButton

const Help = () => {
	// Function to handle opening external links
	const handleOpenLink = async (url) => {
		const supported = await Linking.canOpenURL(url);
		if (supported) {
			await Linking.openURL(url);
		} else {
			Alert.alert("Error", `Don't know how to open this URL: ${url}`);
		}
	};

	// Function to handle contacting support via email
	const handleContactSupport = () => {
		const email = "support@example.com";
		const subject = encodeURIComponent("Support Request");
		const body = encodeURIComponent("Hello,\n\nI need help with...");
		const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

		handleOpenLink(mailtoUrl);
	};

	// Function to handle visiting the FAQ page
	const handleVisitFAQ = () => {
		const faqUrl = "https://www.example.com/faq";
		handleOpenLink(faqUrl);
	};

	// Function to handle visiting the Help Center
	const handleVisitHelpCenter = () => {
		const helpCenterUrl = "https://www.example.com/help-center";
		handleOpenLink(helpCenterUrl);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			{/* Back Button outside ScrollView */}
			<View style={styles.header}>
				<BackButton label="Settings" />
			</View>

			{/* Scrollable Content */}
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.heading}>Help & Support</Text>

				{/* Contact Support */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Contact Support</Text>
					<Text style={styles.cardContent}>
						If you encounter any issues or have questions, feel free to reach
						out to our support team.
					</Text>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleContactSupport}
					>
						<View style={styles.buttonContent}>
							<MaterialIcons name="email" size={24} color="#71A12F" />
							<Text style={styles.actionButtonText}>Email Support</Text>
						</View>
						<MaterialIcons name="chevron-right" size={24} color="#888" />
					</TouchableOpacity>
				</View>

				{/* Frequently Asked Questions */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Frequently Asked Questions (FAQ)</Text>
					<Text style={styles.cardContent}>
						Find answers to common questions about using the Guardian Grain
						Management System.
					</Text>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleVisitFAQ}
					>
						<View style={styles.buttonContent}>
							<MaterialIcons name="help-outline" size={24} color="#71A12F" />
							<Text style={styles.actionButtonText}>Visit FAQ</Text>
						</View>
						<MaterialIcons name="chevron-right" size={24} color="#888" />
					</TouchableOpacity>
				</View>

				{/* Help Center */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Help Center</Text>
					<Text style={styles.cardContent}>
						Access our comprehensive Help Center for detailed guides and
						resources.
					</Text>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={handleVisitHelpCenter}
					>
						<View style={styles.buttonContent}>
							<MaterialIcons name="support-agent" size={24} color="#71A12F" />
							<Text style={styles.actionButtonText}>Visit Help Center</Text>
						</View>
						<MaterialIcons name="chevron-right" size={24} color="#888" />
					</TouchableOpacity>
				</View>

				{/* Additional Help Options (Optional) */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>User Guide</Text>
					<Text style={styles.cardContent}>
						Download or view the user guide to maximize your use of the app.
					</Text>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={() =>
							Alert.alert("User Guide", "This will open the User Guide.")
						}
					>
						<View style={styles.buttonContent}>
							<MaterialIcons name="book" size={24} color="#71A12F" />
							<Text style={styles.actionButtonText}>View User Guide</Text>
						</View>
						<MaterialIcons name="chevron-right" size={24} color="#888" />
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default Help;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F5F5F5", // Matches container background
	},
	header: {
		paddingHorizontal: 16,
		paddingTop: 8,
		backgroundColor: "#F5F5F5",
	},
	container: {
		padding: 16,
		paddingBottom: 32, // Ensure space at the bottom
	},
	heading: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333", // Black heading text
		marginBottom: 16,
		textAlign: "center",
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
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
		marginBottom: 12,
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 8,
	},
	buttonContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	actionButtonText: {
		color: "#71A12F",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 8,
	},
});
