import { Icons } from "@/components/icons";
import { addMinutes, format } from "date-fns";

export interface ChargingData {
	id: string;
	station: {
		name: string;
		slot: string;
		slotId: string;
		connectorType: string;
	};
	pricing: {
		costPerMinute: number;
		costPerUnit: number;
		currency: string;
		currentCost: number;
		refundedAmount?: number; // only for completed sessions
	};
	charging: {
		percentage: number; // Session time progress percentage (0-100%)
		elapsedTime: number;
		power?: number;
		energyDelivered: number;
		estimatedTimeRemaining: string;
		startedAt: string;
		expectedEndAt: string;
		txnId: string; // Transaction ID for the session
		lastUpdated: Date; // Last updated timestamp
	};
	vehicle: {
		name: string;
		id: string;
		batteryCapacity: number;
		maxRange: number;
		image: string;
	};
	location: {
		name: string;
		address: string;
		coordinates: {
			latitude: number;
			longitude: number;
		};
	};
}

export const transformBookingToChargingData = (booking: VehicleCharging): ChargingData => {
	const status = booking.status || "scheduled";
	const startTime = status === "active" || status === "completed" ? booking.started_at || new Date() : booking.datetime;

	const transformedData: ChargingData = {
		id: booking.id.toString(),
		station: {
			name: typeof booking.station === "object" ? booking.station.name : "Charging Station",
			slot: typeof booking.charging_slot === "object" ? booking.charging_slot.name : "Device",
			slotId:
				typeof booking.charging_slot === "object"
					? booking.charging_slot.id.toString()
					: booking.charging_slot.toString(),
			connectorType: typeof booking.charging_slot === "object" ? booking.charging_slot.connector_type : "N/A",
		},
		pricing: {
			costPerMinute: typeof booking.charging_slot === "object" ? booking.charging_slot.price_per_minute || 10 : 10,
			costPerUnit: 10, // ₹10 per kWh
			currency: "₹",
			currentCost: 0, // Will be calculated in real-time
			refundedAmount: 0, // Only for completed sessions
		},
		charging: {
			percentage: 0, // Session time progress - will be calculated in real-time
			elapsedTime: 0, // Will be updated with timer
			estimatedTimeRemaining: "0 mins", // Calculate based on target and current progress
			startedAt: format(new Date(startTime), "dd MMM, hh:mm a"),
			expectedEndAt: format(addMinutes(new Date(startTime), booking.duration_in_minute || 60), "dd MMM, hh:mm a"),
			energyDelivered: Number(booking.power_consumed || 0), // Energy delivered in kWh
			txnId: "", // will be updated through meter readings
			lastUpdated: new Date(),
		},
		vehicle: {
			name: typeof booking.vehicle === "object" ? `${booking.vehicle.brand} ${booking.vehicle.model}` : "Electric Vehicle",
			id: typeof booking.vehicle === "object" ? booking.vehicle.id.toString() : "N/A",
			batteryCapacity: typeof booking.vehicle === "object" ? booking.vehicle.battery_capacity || 40.5 : 40.5,
			maxRange: typeof booking.vehicle === "object" ? booking.vehicle.range_per_charge || 312 : 312,
			image:
				typeof booking.vehicle === "object"
					? booking.vehicle.image || "/assets/images/car.jpg"
					: "/assets/images/car.jpg",
		},
		location: {
			name: typeof booking.station === "object" ? booking.station.name : "Charging Station",
			address: typeof booking.station === "object" ? booking.station.address || "Station Address" : "Station Address",
			coordinates: {
				latitude: typeof booking.station === "object" ? booking.station.latitude || 28.7041 : 28.7041,
				longitude: typeof booking.station === "object" ? booking.station.longitude || 77.1025 : 77.1025,
			},
		},
	};

	return transformedData;
};

export const calculateChargingData = (charginValues: ChargingData, bookingDetails: VehicleCharging) => {
	if (!charginValues || !bookingDetails) return charginValues;
	const status = bookingDetails.status || "scheduled";

	const bookingStartTime = new Date(bookingDetails.started_at || new Date()).getTime();
	const bookingEndTime =
		bookingDetails.status === "active" ? new Date().getTime() : new Date(bookingDetails.stopped_at || new Date()).getTime();
	const elapsedTimeSeconds = Math.ceil((bookingEndTime - bookingStartTime) / 1000);
	const totalDurationSeconds = bookingDetails.duration_in_minute * 60;

	const timeProgressPercentage = Math.min(100, Math.floor((elapsedTimeSeconds / totalDurationSeconds) * 100));
	const timeElapsedFromLastUpdateInSec = Math.floor((Date.now() - charginValues.charging.lastUpdated.getTime()) / 1000);

	// const energyPerSecond = charginValues.charging?.power / 3600;
	// const energyDelivered =
	// 	status === "completed"
	// 		? charginValues?.charging?.energyDelivered
	// 		: charginValues?.charging?.energyDelivered + timeElapsedFromLastUpdateInSec * energyPerSecond;

	// Always use energy-based pricing (kWh × ₹10/kWh)
	const energyDelivered = Number(bookingDetails.power_consumed || 0);
	const baseCost = charginValues.pricing.costPerUnit * energyDelivered;
	const taxPercentage = (bookingDetails.station as any).tax || 0;
	const taxAmount = (baseCost * taxPercentage) / 100;
	const currentCost = baseCost + taxAmount;

	const totalAmountPaid = Number(bookingDetails.amount_paid || 0) || 0;
	const refundedAmount = Math.max(0, totalAmountPaid - currentCost).toFixed(2);

	// Calculate remaining time
	const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedTimeSeconds);
	const remainingMinutes = Math.floor(remainingSeconds / 60);
	const estimatedTimeRemaining =
		remainingMinutes > 0 ? `${remainingMinutes} mins` : remainingMinutes == 0 ? "Few seconds" : "Completed";

	return {
		...charginValues,
		pricing: {
			...charginValues.pricing,
			currentCost: currentCost,
			refundedAmount: Number(refundedAmount || 0),
		},
		charging: {
			...charginValues.charging,
			percentage: timeProgressPercentage,
			elapsedTime: elapsedTimeSeconds,
			energyDelivered,
			estimatedTimeRemaining,
			power: bookingDetails?.final_reading?.power || 0,
		},
	};
};

export const getStatusConfig = (status: string) => {
	const configs = {
		scheduled: {
			background: "bg-blue-50 border-blue-200",
			indicatorColor: "bg-blue-500",
			textColor: "text-blue-800",
			lightTextColor: "text-blue-600",
			icon: <Icons.CalendarIcon className="h-3 w-3" />,
			label: "Charging Scheduled",
			showAnimation: false,
		},
		active: {
			background: "bg-green-50 border-green-200",
			indicatorColor: "bg-green-500",
			textColor: "text-green-800",
			lightTextColor: "text-green-600",
			icon: <Icons.BoltIcon className="h-3 w-3" />,
			label: "Charging Session Active",
			showAnimation: true,
		},
		completed: {
			background: "bg-gray-50 border-gray-200",
			indicatorColor: "bg-gray-500",
			textColor: "text-gray-800",
			lightTextColor: "text-gray-600",
			icon: <Icons.CheckIcon className="h-3 w-3" />,
			label: "Charging Session Completed",
			showAnimation: false,
		},
		cancelled: {
			background: "bg-red-50 border-red-200",
			indicatorColor: "bg-red-500",
			textColor: "text-red-800",
			lightTextColor: "text-red-600",
			icon: <Icons.CloseIcon className="h-3 w-3" />,
			label: "Charging Session Cancelled",
			showAnimation: false,
		},
	};

	return configs[status as keyof typeof configs] || configs.scheduled;
};
