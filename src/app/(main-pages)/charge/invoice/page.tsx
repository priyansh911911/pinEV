"use client";

import { toast } from "sonner";
import { addMinutes } from "date-fns";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Header from "@/components/custom/header";
import Loader from "@/components/custom/loader";
import Transition from "@/components/custom/transition";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getVehiclesChargings } from "@/actions/vehicles-chargings";
import {
	cn,
	formatCurrency,
	formatDate,
	capitalizeSentence,
	calculatedDuration,
	splitAmountWithTax,
	toUrlSafeBase64,
} from "@/lib/utils";

const Invoice = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const bookingId = searchParams.get("bookingId") || searchParams.get("id");

	const [showBillDetails, setShowBillDetails] = useState<boolean>(false);
	const [bookingDetails, setBookingDetails] = useState<VehicleCharging | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const handleGetBooking = useCallback(async () => {
		if (!bookingId) {
			toast.error("No booking ID provided");
			router.push("/bookings");
			return;
		}

		setIsLoading(true);

		try {
			const res = await getVehiclesChargings({
				search: `id:${bookingId}`,
				joins: "charging_slot:stations_slots,station:stations,vehicle:vehicles",
			});

			if (res.err || res.count === 0) {
				console.log("Error fetching booking details:", res.result);
				toast.error("Booking not found");
				return;
			}

			setBookingDetails(res.result[0]);
		} catch (error) {
			console.log("Error fetching booking details:", error);
			toast.error("Failed to fetch booking details");
		} finally {
			setIsLoading(false);
		}
	}, [bookingId, router]);

	useEffect(() => {
		handleGetBooking();
	}, [handleGetBooking]);

	if (isLoading) {
		return <Loader />;
	}

	if (!bookingDetails) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4">
				<p>Invoice not found</p>
				<Button onClick={() => router.replace("/bookings")}>Go to Bookings</Button>
			</div>
		);
	}

	// Extract typed data
	const station = typeof bookingDetails.station !== "number" ? bookingDetails.station : null;
	const vehicle = typeof bookingDetails.vehicle !== "number" ? bookingDetails.vehicle : null;
	const chargingSlot = typeof bookingDetails.charging_slot !== "number" ? bookingDetails.charging_slot : null;

	// Calculate charging duration
	const getDurationDisplay = () => {
		if (bookingDetails.status === "completed" && bookingDetails.started_at && bookingDetails.stopped_at) {
			const start = new Date(bookingDetails.started_at);
			const end = new Date(bookingDetails.stopped_at);

			const duration = calculatedDuration(start, end, { short: true });
			return duration || "0 min";
		}

		const start = new Date(bookingDetails.datetime);
		const end = addMinutes(start, bookingDetails.duration_in_minute || 0);
		const duration = calculatedDuration(start, end, { short: true });

		return duration || "0 min";
	};

	// Calculate power consumption (estimated)
	const getPowerConsumption = () => {
		if (bookingDetails.final_reading && bookingDetails.initial_reading) {
			const initialReading = Number(bookingDetails.initial_reading) || 0;
			const finalReading = Number(bookingDetails.final_reading.energy) || 0;
			const consumption = finalReading - initialReading;
			return (consumption / 1000).toFixed(2); // Convert Wh to kWh
		}

		return "0.0";
	};

	//TODO: Generate invoice number
	const invoiceNumber = `EV${String(bookingDetails.id).padStart(7, "0")}`;

	const totalAmount = bookingDetails.final_amount || 0;
	const taxPercentage = station?.tax || 0;
	const { baseAmount, taxAmount } = splitAmountWithTax(totalAmount, taxPercentage);

	return (
		<Transition>
			<Header
				headerBackground="bg-white"
				left={
					<Button onClick={() => router.back()} variant="link" className="p-0 m-0">
						<Icons.ArrowLeftIcon className="text-foreground" />
					</Button>
				}
			>
				<h1 className="line-clamp-1 text-lg font-semibold pr-10">Invoice</h1>
			</Header>
			<Layout fullWidth className="pt-24 bg-gray-200 h-screen overflow-y-scroll">
				<div className="default-page-width">
					<div className="bg-background h-fit w-full mx-auto rounded-xl">
						<div className="flex justify-between border-b-2 border-gray-400 p-4">
							<div>
								<h2 className="text-gray-600 font-semibold text-sm">{chargingSlot?.name || "Charging Slot"}</h2>
								<h2 className="font-semibold text-sm">Device ID: {toUrlSafeBase64(chargingSlot?.id || "")}</h2>
							</div>
							<div>
								<p className="text-white h-8 bg-green-600 flex rounded-lg gap-1 items-center justify-center text-sm font-semibold px-2 py-1">
									<Icons.CheckIcon className="w-4 font-bold" />
									{capitalizeSentence(bookingDetails.status)}
								</p>
							</div>
						</div>
						<div className="p-4 space-y-6">
							<h2 className="text-gray-600 font-semibold text-sm">Charge Details</h2>
							<div className="flex justify-between gap-32 font-semibold text-sm">
								<p className="text-black">Port</p>
								<p className="font-bold text-black">{chargingSlot?.name || "N/A"}</p>
							</div>
							<div className="flex justify-between gap-32 font-semibold text-sm">
								<p className="text-black">Plug Type</p>
								<p className="font-bold text-black">
									{chargingSlot?.power && chargingSlot?.connector_type
										? `${chargingSlot.power}kW ${chargingSlot.connector_type}`
										: "N/A"}
								</p>
							</div>
							<div className="flex justify-between gap-32 font-semibold text-sm">
								<p className="text-black">Invoice No.</p>
								<p className="font-bold text-black">{invoiceNumber}</p>
							</div>
							<div className="flex justify-between gap-32 font-semibold text-sm">
								<p className="text-black">Venue</p>
								<p className="font-bold text-black text-right">{station?.name || "Charging Station"}</p>
							</div>
							<div className="flex justify-between gap-32 font-semibold text-sm">
								<p className="text-black">Charge Duration</p>
								<p className="font-bold text-black">{getDurationDisplay()}</p>
							</div>
							<div className="flex justify-between gap-32 font-semibold text-sm">
								<p className="text-black">Power Consumption</p>
								<p className="font-bold text-black">{getPowerConsumption()} kWh</p>
							</div>
							{bookingDetails.status === "completed" && (
								<>
									<div className="flex justify-between gap-32 font-semibold text-sm">
										<p className="text-black">Started At</p>
										<p className="font-bold text-black">
											{bookingDetails.started_at
												? formatDate("DD MMM YYYY, hh:mm a", new Date(bookingDetails.started_at))
												: "N/A"}
										</p>
									</div>
									<div className="flex justify-between gap-32 font-semibold text-sm">
										<p className="text-black">Completed At</p>
										<p className="font-bold text-black">
											{bookingDetails.stopped_at
												? formatDate("DD MMM YYYY, hh:mm a", new Date(bookingDetails.stopped_at))
												: "N/A"}
										</p>
									</div>
								</>
							)}
							{vehicle && (
								<div className="flex justify-between gap-32 font-semibold text-sm">
									<p className="text-black">Vehicle</p>
									<p className="font-bold text-black text-right">
										{vehicle.brand} {vehicle.model} • {(vehicle as any).details?.vehicle_number || "N/A"}
									</p>
								</div>
							)}
						</div>

						<div className="p-4 border-t border-gray-400">
							<div onClick={() => setShowBillDetails(!showBillDetails)} className="flex justify-between">
								<p className="font-bold text-md">Total Paid</p>
								<p className="bg-green-100 rounded-full py-1 px-3 flex gap-2">
									{formatCurrency(totalAmount)}
									<Icons.ChevronRightIcon
										className={cn("-rotate-90 w-4 h-auto transition-transform duration-300", {
											"rotate-90": showBillDetails,
										})}
									/>
								</p>
							</div>
							<div
								className={cn("hidden mt-4 space-y-4 scale-y-0 transition-transform duration-300 origin-top", {
									"scale-y-100 origin-top block": showBillDetails,
								})}
							>
								{/* <div className="flex justify-between">
									<p className="font-semibold text-neutral-500 text-md">Charge Type</p>
									<p className="font-semibold text-base">{getChargeType()}</p>
								</div> */}
								<div className="flex justify-between">
									<p className="font-semibold text-neutral-500 text-md">Charge Rate</p>
									<p className="font-semibold text-base">
										{chargingSlot?.price_per_minute
											? `${formatCurrency(Number(station?.price_per_kwh) || 0)}/kWh`
											: "N/A"}
									</p>
								</div>
								{taxPercentage > 0 ? (
									<>
										<div className="flex justify-between">
											<p className="font-semibold text-neutral-500 text-md">Base Amount</p>
											<p className="font-semibold text-base">{formatCurrency(baseAmount)}</p>
										</div>
										<div className="flex justify-between">
											<p className="font-semibold text-neutral-500 text-md">Tax ({taxPercentage}%)</p>
											<p className="font-semibold text-base">{formatCurrency(taxAmount)}</p>
										</div>
									</>
								) : (
									<div className="flex justify-between">
										<p className="font-semibold text-neutral-500 text-md">Amount</p>
										<p className="font-semibold text-base">{formatCurrency(totalAmount)}</p>
									</div>
								)}
								<div className="flex justify-between pt-4 pb-10 border-t border-neutral-500">
									<p className="font-semibold text-neutral-500 text-md">Total</p>
									<p className="font-semibold text-green-500 text-base">{formatCurrency(totalAmount)}</p>
								</div>
							</div>
						</div>
					</div>
					<div className="h-10"></div>
					<Button onClick={() => router.replace("/home")} className="w-full rounded-3xl" size="xl">
						Done
					</Button>
					<div className="h-20"></div>
				</div>
			</Layout>
		</Transition>
	);
};

export default Invoice;
