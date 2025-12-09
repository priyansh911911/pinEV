import { useState } from "react";

export const useStationManagement = () => {
	const [loadingState, setLoadingState] = useState<"idle" | "fetching" | "submitting">("idle");
	const [station, setStation] = useState<AdminStation | null>(null);
	const [stationStartTime, setStationStartTime] = useState("08:00");
	const [stationEndTime, setStationEndTime] = useState("20:00");
	const [slots, setSlots] = useState<ChargingSlot[]>([]);
	const [pricePerKwh, setPricePerKwh] = useState("");
	const [taxPercentage, setTaxPercentage] = useState(0);

	return {
		loadingState,
		setLoadingState,
		station,
		setStation,
		stationStartTime,
		setStationStartTime,
		stationEndTime,
		setStationEndTime,
		slots,
		setSlots,
		pricePerKwh,
		setPricePerKwh,
		taxPercentage,
		setTaxPercentage,
	};
};
