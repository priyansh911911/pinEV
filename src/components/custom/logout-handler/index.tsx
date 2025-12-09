"use client";

import { useLogoutHandler } from "@/hooks/useLogoutHandler";

/**
 * Component that handles automatic stopping of charging sessions
 * when the user logs out or closes the app
 */
const LogoutHandler = () => {
	useLogoutHandler();
	return null;
};

export default LogoutHandler;