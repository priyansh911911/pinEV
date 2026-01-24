import { useEffect, useRef } from "react";
import { stopActiveChargingSessions } from "@/functions/logout-handler";
import { startHeartbeat } from "@/functions/heartbeat";
import Stores from "@/lib/stores";

/**
 * Hook to handle automatic stopping of charging sessions when the app is closed
 * or when the user navigates away from the app
 */
export const useLogoutHandler = () => {
	const { user, isLoggedin } = Stores();
	const lastStopTime = useRef<number>(0);
	const STOP_COOLDOWN = 30000; // 30 seconds cooldown to prevent multiple calls

	useEffect(() => {
		if (!isLoggedin || !user?.id) return;

		// Start heartbeat monitoring
		const stopHeartbeat = startHeartbeat(String(user.id));

		const stopSessionsWithCooldown = async () => {
			const now = Date.now();
			if (now - lastStopTime.current < STOP_COOLDOWN) {
				return; // Skip if called too recently
			}
			lastStopTime.current = now;

			try {
				await stopActiveChargingSessions(String(user.id));
			} catch (error) {
				console.error("Error stopping charging sessions:", error);
			}
		};

		// Cleanup event listeners
		return () => {
			stopHeartbeat();
		};
	}, [user?.id, isLoggedin]);
};