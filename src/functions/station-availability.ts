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

	if (availability === 'booked' || availability === 'inactive') {
		return '/assets/icons/pin_inactive1.png';
	}

	return '/assets/icons/pin-active.svg';
};