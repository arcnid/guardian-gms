// hooks/useAuthRedirect.js
import { useContext, useEffect } from "react";
import { useRouter } from "expo-router";
import { AuthContext } from "../contexts/AuthContext"; // Adjust the path if necessary

const useAuthRedirect = () => {
	const router = useRouter();
	const { isLoggedIn } = useContext(AuthContext);

	useEffect(() => {
		// If the user is not logged in, redirect to the login screen
		if (isLoggedIn === false) {
			router.replace("/login");
		}
	}, [isLoggedIn, router]);

	// Return isLoggedIn status so you can conditionally render components if needed
	return isLoggedIn;
};

export default useAuthRedirect;
