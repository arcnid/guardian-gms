// styles/styles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F5F5F5",
	},
	card: {
		padding: 20,
		borderRadius: 10,
		backgroundColor: "#FFF",
		elevation: 3,
		width: "80%",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
		textAlign: "center",
	},
	titleSmall: {
		fontSize: 16,
		marginBottom: 20,
		textAlign: "center",
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		borderColor: "#ddd",
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 15,
		paddingHorizontal: 10,
	},
	icon: {
		marginRight: 8,
	},
	input: {
		flex: 1,
		paddingVertical: 10,
		borderWidth: 0, // Avoid inner border
		borderColor: "transparent", // No color change on focus
	},
	loginButton: {
		backgroundColor: "#71A12F",
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center",
	},
	buttonText: {
		color: "#FFF",
		fontWeight: "bold",
		fontSize: 16,
	},
});
