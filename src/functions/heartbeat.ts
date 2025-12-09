import { stopActiveChargingSessions } from "./logout-handler";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 120000; // 2 minutes

/**
 * Starts heartbeat to detect if app is killed by OS
 */
export const startHeartbeat = (userId: string) => {
	const heartbeatKey = `heartbeat_${userId}`;
	
	const updateHeartbeat = () => {
		localStorage.setItem(heartbeatKey, Date.now().toString());
	};

	const checkHeartbeat = async () => {
		const lastHeartbeat = localStorage.getItem(heartbeatKey);
		if (lastHeartbeat) {
			const timeSinceLastHeartbeat = Date.now() - parseInt(lastHeartbeat);
			if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
				await stopActiveChargingSessions(userId);
			}
		}
	};

	// Update heartbeat every 30 seconds
	const heartbeatInterval = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);
	
	// Check heartbeat on app start
	checkHeartbeat();
	
	// Initial heartbeat
	updateHeartbeat();

	return () => {
		clearInterval(heartbeatInterval);
		localStorage.removeItem(heartbeatKey);
	};
};