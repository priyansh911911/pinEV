/**
 * Determines the availability status of a charging station
 * @param station - The station with slots information
 * @param bookings - Optional array of current bookings
 * @returns 'available' | 'booked' | 'inactive'
 */
export const getStationAvailability = (
	station: StationWithNearby,
	bookings?: Booking[]
): 'available' | 'booked' | 'inactive' => {
	// Check if station has any active slots
	const activeSlots = station.slots.filter(slot => slot.status === 'active');
	
	if (activeSlots.length === 0) {
		return 'inactive';
	}

	// If time slots are available for booking, connectors should also be available
	const hasAvailableSlots = activeSlots.some(slot => 
		slot.schedules && slot.schedules.length > 0
	);

	return hasAvailableSlots ? 'available' : 'booked';
};

/**
 * Gets the appropriate pin icon based on station availability
 * @param station - The station to check
 * @param bookings - Optional array of current bookings
 * @param isNearest - Whether this is the nearest station
 * @returns The path to the appropriate pin icon
 */
export const getStationPinIcon = (
	station: StationWithNearby,
	bookings?: Booking[],
	isNearest?: boolean
): string => {
	const availability = getStationAvailability(station, bookings);
	
	switch (availability) {
		case 'available':
			return "/logo.png";
		case 'booked':
		case 'inactive':
		default:
			return "/red logo.png";
	}
};