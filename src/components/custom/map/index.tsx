"use client";

import { FC } from "react";
import dynamic from "next/dynamic";
import Loader from "@/components/custom/loader";

// Dynamically import the MapContent component with SSR disabled
const MapContent = dynamic(
	() => import("./MapContent"),
	{
		ssr: false,
		loading: () => <Loader />
	}
);

interface MapProps {
	stations: StationWithNearby[];
	center: { lat: number; lng: number };
	bookings?: Booking[];
	chargingSessions?: VehicleCharging[];
}

const Map: FC<MapProps> = (props) => {
	return (
		<div className="w-full h-full z-0 relative">
			<MapContent {...props} />
		</div>
	);
};

export default Map;
