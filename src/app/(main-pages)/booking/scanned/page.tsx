"use client";

import { toast } from "sonner";
import Stores from "@/lib/stores";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/custom/header";
import Loader from "@/components/custom/loader";
import { Separator } from "@/components/ui/separator";
import Transition from "@/components/custom/transition";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { getVehiclesChargings, updateVehicleCharging } from "@/actions/vehicles-chargings";
import { formatDate, formatCurrency, capitalizeSentence, toUrlSafeBase64, inBetweenRandomGenerator } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateStationsSlots } from "@/actions/stations-slots";
import { getSlotStatus, getUnusedConnectorId, toggleCharging } from "@/functions/charging";

const BookingDetailsPage = () => {
	return (
		<Suspense fallback={<Loader />}>
			<Component />
		</Suspense>
	);
};

export default BookingDetailsPage;

const Component = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const bookingId = searchParams.get("bookingId") || searchParams.get("id");

	const [bookingDetails, setBookingDetails] = useState<VehicleCharging | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [startingCharge, setStartingCharge] = useState<boolean>(false);

	const { user } = Stores();

	const handleGetBooking = useCallback(async () => {
		if (!bookingId) {
			router.push("/home");
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
				router.push("/bookings");
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
				<p>Booking not found</p>
				<Button onClick={() => router.replace("/bookings")}>Go to Bookings</Button>
			</div>
		);
	}

	const getStatusConfig = (status: string) => {
		switch (status) {
			case "scheduled":
				return {
					color: "bg-blue-100 text-blue-800 border-blue-200",
					icon: <Icons.ClockIcon className="w-4 h-4" />,
					label: "Scheduled",
					bgGradient: "from-blue-50 to-blue-100",
				};
			case "active":
				return {
					color: "bg-green-100 text-green-800 border-green-200",
					icon: <Icons.BoltIcon className="w-4 h-4" />,
					label: "Active",
					bgGradient: "from-green-50 to-green-100",
				};
			case "completed":
				return {
					color: "bg-gray-100 text-gray-800 border-gray-200",
					icon: <Icons.CheckIcon className="w-4 h-4" />,
					label: "Completed",
					bgGradient: "from-gray-50 to-gray-100",
				};
			case "cancelled":
				return {
					color: "bg-red-100 text-red-800 border-red-200",
					icon: <Icons.CloseIcon className="w-4 h-4" />,
					label: "Cancelled",
					bgGradient: "from-red-50 to-red-100",
				};
			default:
				return {
					color: "bg-gray-100 text-gray-800 border-gray-200",
					icon: <Icons.InfoIcon className="w-4 h-4" />,
					label: "Unknown",
					bgGradient: "from-gray-50 to-gray-100",
				};
		}
	};

	const statusConfig = getStatusConfig(bookingDetails.status);

	// Extract typed data
	const station = typeof bookingDetails.station !== "number" ? bookingDetails.station : null;
	const vehicle = typeof bookingDetails.vehicle !== "number" ? bookingDetails.vehicle : null;
	const chargingSlot = typeof bookingDetails.charging_slot !== "number" ? bookingDetails.charging_slot : null;

	const getDurationDisplay = () => {
		const minutes = bookingDetails.duration_in_minute;
		if (minutes >= 60) {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
		}
		return `${minutes}m`;
	};

	const handleStartCharge = async () => {
		const deviceId = (bookingDetails?.charging_slot as StationSlot)?.id;
		// const deviceId = (bookingDetails?.station as AdminStation)?.id;

		setStartingCharge(true);

		try {
			if (!bookingDetails) {
				toast.error("Booking details not found");
				return;
			}

			const slotStatusRes = await getSlotStatus(deviceId);

			if (slotStatusRes.err || slotStatusRes.count === 0) {
				console.error("Error fetching slot status:", slotStatusRes.result);
				toast.error("Failed to fetch charging device status");
				return;
			}
			const slot: StationSlot = slotStatusRes.result[0];

			// const isBusy = (slot.active_connectors || []).length === slot.no_of_connector;

			// if (isBusy) {
			// 	toast.error("Charging device is currently busy. Please try again later.");
			// 	return;
			// }

			// const connectorId = getUnusedConnectorId(slot);

			// if (!connectorId) {
			// 	toast.error("No available connector found for this charging device.");
			// 	return;
			// }

			// TODO: Generate a unique transaction ID
			const transactionId = inBetweenRandomGenerator(1_00_000, 9_99_999);
			const connectorId = Math.floor(Math.random() * slot.no_of_connector) + 1;

			const startRes = await toggleCharging({
				deviceId: toUrlSafeBase64(deviceId),
				connectorId: connectorId.toString(),
				transactionId: transactionId,
				idTag: String(user.id),
				type: "start",
			});

			// console.log("startRes", startRes);

			if (startRes.err) {
				console.error("Error starting charge:", startRes.result);
				toast.error("Failed to start: " + startRes.result);
				return;
			}

			const { status } = startRes.result;

			if (status !== "Accepted") {
				toast.error("Session not Started");
				return;
			}

			const bookingData = {
				status: "active",
				started_at: formatDate("YYYY-MM-DD HH:mm:ss", new Date()),
				charge_txn_id: transactionId,
			};

			const res = await updateVehicleCharging({ id: bookingId, body: bookingData });
			const deviceRes = await updateStationsSlots({
				id: deviceId,
				body: {
					active_connectors: [...(slot.active_connectors || []), connectorId],
				},
			});

			if (res.err) {
				console.error("Error updating booking:", res.err);
				return;
			}

			toast.success("Charging session started successfully!");
			router.push("/charge?bookingId=" + bookingId);
		} catch (error) {
			console.error("Error starting charge:", error);
			toast.error("Failed to start charging session");
		} finally {
			setStartingCharge(false);
		}
	};

	return (
		<Transition>
			<Header
				left={
					<Button onClick={() => router.back()} variant="link" className="p-0 m-0 text-white">
						<Icons.ArrowLeftIcon />
					</Button>
				}
			/>

			<Layout fullWidth className={`min-h-screen bg-gradient-to-br ${statusConfig.bgGradient}`}>
				<div className="bg-gradient-to-br from-primary to-primary/80 rounded-b-3xl px-6 py-8 text-white">
					<div className="text-center space-y-3">
						<div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
							<Icons.FileTextIcon className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-xl font-bold">Booking Details</h1>
						<p className="text-white/90 text-sm">Booking ID: #{bookingDetails.id}</p>
						<Badge className={`${statusConfig.color} border`}>
							{statusConfig.icon}
							<span className="ml-1">{statusConfig.label}</span>
						</Badge>
					</div>
				</div>

				<div className="px-6 py-4 space-y-6 pb-24">
					<Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
								<Icons.InfoIcon className="w-5 h-5 text-blue-600" />
								Booking Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-start gap-4 p-3 bg-blue-50 rounded-xl">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Icons.ChargingStationIcon className="w-5 h-5 text-blue-600" />
								</div>
								<div className="flex-1">
									<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Charging Station</p>
									<h3 className="font-semibold text-gray-900 text-base">
										{station?.name || "Unknown Station"}
									</h3>
									<p className="text-sm text-gray-600 mt-1">{station?.address || "No address available"}</p>
								</div>
							</div>

							<div className="flex items-start gap-4 p-3 bg-green-50 rounded-xl">
								<div className="p-2 bg-green-100 rounded-lg">
									<Icons.CarIcon className="w-5 h-5 text-green-600" />
									{/* <Image
										src={
											vehicle?.image
												? `${process.env.NEXT_PUBLIC_IMAGE_URL}${vehicle.image}`
												: "/assets/images/car.jpg"
										}
										alt="Vehicle"
										width={100}
										height={100}
										className="w-32 h-auto object-contain"
									/> */}
								</div>
								<div className="flex-1">
									<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Vehicle</p>
									<h3 className="font-semibold text-gray-900 text-base">
										{vehicle ? `${vehicle.brand} ${vehicle.model}` : "Unknown Vehicle"}
									</h3>
									{vehicle && (
										<div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
											<span className="flex items-center gap-1">
												<Icons.TagIcon className="w-3 h-3" />
												{(vehicle as any).details?.vehicle_number || "N/A"}
											</span>
											<span className="flex items-center gap-1">
												<Icons.BatteryIcon className="w-3 h-3" />
												{(vehicle as any).details?.battery_capacity || "N/A"} kW
											</span>
										</div>
									)}
								</div>
							</div>

							<div className="flex items-start gap-4 p-3 bg-purple-50 rounded-xl">
								<div className="p-2 bg-purple-100 rounded-lg">
									<Icons.BoltIcon className="w-5 h-5 text-purple-600" />
								</div>
								<div className="flex-1">
									<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Charging Device</p>
									<h3 className="font-semibold text-gray-900 text-base">
										{chargingSlot?.name || "Unknown Device"} #{toUrlSafeBase64(chargingSlot?.id || "")}
									</h3>
									{chargingSlot && (
										<div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
											<span>{chargingSlot.power} kW</span>
											<span>{chargingSlot.connector_type}</span>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
								<Icons.CalendarIcon className="w-5 h-5 text-purple-600" />
								Session Details
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Date & Time</p>
									<p className="font-semibold text-gray-900">
										{formatDate("DD MMM YYYY", bookingDetails.datetime)}
									</p>
									<p className="text-sm text-gray-600">{formatDate("hh:mm A", bookingDetails.datetime)}</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Duration</p>
									<p className="font-semibold text-gray-900">{getDurationDisplay()}</p>
									<p className="text-sm text-gray-600">Booking duration</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
								<Icons.WalletIcon className="w-5 h-5 text-green-600" />
								Payment Information
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
									<div>
										<p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Amount</p>
										<p className="text-2xl font-bold text-gray-900">
											{formatCurrency(bookingDetails.amount_paid || 0)}
										</p>
										<p className="text-sm text-gray-600">Including all taxes</p>
									</div>
									<div className="p-3 bg-green-100 rounded-full">
										<Icons.IndianRupeeIcon className="w-6 h-6 text-green-600" />
									</div>
								</div>

								<div className="space-y-3">
									<Separator />
									<div className="space-y-2">
										<h4 className="font-semibold text-gray-800">Pricing Breakdown</h4>
										<div className="space-y-2 text-sm">
											{chargingSlot && (
												<div className="flex justify-between">
													<span className="text-gray-600">Rate per minute</span>
													<span className="font-medium">
														{formatCurrency(chargingSlot.price_per_minute)}/min
													</span>
												</div>
											)}
											<div className="flex justify-between">
												<span className="text-gray-600">Duration</span>
												<span className="font-medium">{getDurationDisplay()}</span>
											</div>
											{station?.tax && (
												<>
													<div className="flex justify-between">
														<span className="text-gray-600">Base amount</span>
														<span className="font-medium">
															{formatCurrency(
																(bookingDetails.amount_paid || 0) / (1 + station.tax / 100)
															)}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-gray-600">Tax ({station.tax}%)</span>
														<span className="font-medium">
															{formatCurrency(
																(bookingDetails.amount_paid || 0) -
																	(bookingDetails.amount_paid || 0) / (1 + station.tax / 100)
															)}
														</span>
													</div>
												</>
											)}
											<Separator />
											<div className="flex justify-between font-semibold">
												<span>Total Amount</span>
												<span className="text-green-600">
													{formatCurrency(bookingDetails.amount_paid || 0)}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card> */}

					<div className="space-y-3 sticky bottom-tab left-0 right-0">
						<div className="bg-background rounded-2xl">
							<Button
								isLoading={startingCharge}
								onClick={handleStartCharge}
								className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-lg shadow-lg"
								leftIcon={<Icons.PowerIcon className="w-5 h-5" />}
							>
								Start Charging
							</Button>
						</div>
					</div>
				</div>
			</Layout>
		</Transition>
	);
};
