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

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			// Use sendBeacon for more reliable delivery when page is unloading
			if (navigator.sendBeacon) {
				// This is a fire-and-forget approach for page unload
				navigator.sendBeacon('/api/stop-charging', JSON.stringify({ userId: String(user.id) }));
			} else {
				// Fallback for browsers that don't support sendBeacon
				stopSessionsWithCooldown();
			}
		};



		// Add event listeners
		window.addEventListener('beforeunload', handleBeforeUnload);

		// Cleanup event listeners
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			stopHeartbeat();
		};
	}, [user?.id, isLoggedin]);
};