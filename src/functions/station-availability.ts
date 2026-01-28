/**
 * Determines the availability status of a charging station
 * @param station - The station with slots information
 * @param bookings - Optional array of current bookings
 * @param chargingSessions - Optional array of active charging sessions
 * @returns 'available' | 'booked' | 'inactive'
 */
export const getStationAvailability = (
	station: StationWithNearby,
	bookings?: Booking[],
	chargingSessions?: VehicleCharging[]
): 'available' | 'booked' | 'inactive' => {
	// Check if station has any active slots
	const activeSlots = station.slots.filter(slot => slot.status === 'active');
	
	if (activeSlots.length === 0) {
		return 'inactive';
	}

	if (chargingSessions && chargingSessions.length > 0) {
		// Get the very next booking for this station
		const now = new Date();
		const nextBooking = chargingSessions
			.filter(session => {
				const sessionStationId = typeof session.station === 'object' ? session.station.id : session.station;
				return sessionStationId === station.id && session.status === 'scheduled';
			})
			.map(session => new Date(session.datetime))
			.filter(date => date > now)
			.sort((a, b) => a.getTime() - b.getTime())[0];

		if (nextBooking) {
			console.log(`Station ${station.id}: next booking at ${nextBooking.toISOString()}`);
			return 'booked';
		}
	}

	// Next slot is available
	console.log(`Station ${station.id}: next slot is available`);
	return 'available';
};

/**
 * Gets the appropriate pin icon based on station availability
 * @param station - The station to check
 * @param bookings - Optional array of current bookings
 * @param chargingSessions - Optional array of active charging sessions
 * @param isNearest - Whether this is the nearest station
 * @returns The path to the appropriate pin icon
 */
export const getStationPinIcon = (
	station: StationWithNearby,
	bookings?: Booking[],
	chargingSessions?: VehicleCharging[],
	isNearest?: boolean
): string => {
	const availability = getStationAvailability(station, bookings, chargingSessions);
	
	let color = '#22C55E'; // Green for available
	let glowColor = '#22C55E40'; // Green glow
	
	if (availability === 'booked' || availability === 'inactive') {
		color = '#EF4444'; // Red for booked/inactive
		glowColor = '#EF444440'; // Red glow
	}
	
	const svgIcon = `
		<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<filter id="glow">
					<feGaussianBlur stdDeviation="4" result="coloredBlur"/>
					<feMerge>
						<feMergeNode in="coloredBlur"/>
						<feMergeNode in="SourceGraphic"/>
					</feMerge>
				</filter>
				<radialGradient id="pinGradient" cx="50%" cy="30%">
					<stop offset="0%" stop-color="white" stop-opacity="0.3"/>
					<stop offset="100%" stop-color="${color}" stop-opacity="1"/>
				</radialGradient>
			</defs>
			
			<!-- Outer glow circle -->
			<circle cx="24" cy="20" r="20" fill="${glowColor}" opacity="0.6"/>
			
			<!-- Pin shape with gradient -->
			<path d="M24 4C15.163 4 8 11.163 8 20c0 12 16 32 16 32s16-20 16-32C40 11.163 32.837 4 24 4z" 
				  fill="url(#pinGradient)" filter="url(#glow)" stroke="white" stroke-width="2"/>
			
			<!-- Inner white circle -->
			<circle cx="24" cy="20" r="10" fill="white" stroke="${color}" stroke-width="2"/>
			
			<!-- Charging bolt -->
			<path d="M26 16l-3 4h2l-1 3 3-4h-2l1-3z" fill="${color}" stroke="none"/>
		</svg>
	`;
	
	return `data:image/svg+xml;base64,${btoa(svgIcon)}`;
};