import { stopActiveChargingSessions } from "./logout-handler";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
let inactivityTimer: NodeJS.Timeout | null = null;
let lastActivity = Date.now();

/**
 * Starts monitoring user activity and stops charging sessions after inactivity
 */
export const startInactivityMonitor = (userId: string) => {
	const resetTimer = () => {
		lastActivity = Date.now();
		
		if (inactivityTimer) {
			clearTimeout(inactivityTimer);
		}
		
		inactivityTimer = setTimeout(async () => {
			await stopActiveChargingSessions(userId);
		}, INACTIVITY_TIMEOUT);
	};

	// Track user interactions
	const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
	events.forEach(event => {
		document.addEventListener(event, resetTimer, true);
	});

	// Initial timer
	resetTimer();

	return () => {
		events.forEach(event => {
			document.removeEventListener(event, resetTimer, true);
		});
		if (inactivityTimer) {
			clearTimeout(inactivityTimer);
		}
	};
};