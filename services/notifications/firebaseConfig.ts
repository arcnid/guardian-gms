import { initializeApp, getApps } from "firebase/app";
import googleSerivces from "@/google-services.json";

const firebaseConfig = {
	apiKey: "AIzaSyDwEOcPwdtJSti0QdeLtjXetgi2LWXl9XE",

	projectId: "notifications-a9894",
	storageBucket: "notifications-a9894.firebasestorage.app",

	appId: "1:266036915845:android:9163a37823143189c003ec",
};

export const initializeFirebase = () => {
	if (!getApps().length) {
		console.log("Initializing Firebase");

		initializeApp(firebaseConfig);
	}
};
