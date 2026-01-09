"use client";

import Image from "next/image";
import { toast } from "sonner";
import Stores from "@/lib/stores";
import Layout from "@/components/layout";
import useWallet from "@/hooks/useWallet";
import { Icons } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { saveTransaction } from "@/actions/transactions";
import CustomProgress from "@/components/ui/custom-progress";
import { updateStationsSlots } from "@/actions/stations-slots";
import { cn, formatCurrency, sendToNative, toUrlSafeBase64 } from "@/lib/utils";
import { getVehiclesChargings, updateVehicleCharging } from "@/actions/vehicles-chargings";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getReadings, getSlotStatus, toggleCharging } from "@/functions/charging";
import { calculateChargingData, ChargingData, getStatusConfig, transformBookingToChargingData } from "./_actions";

const ChargingStatusPage = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const bookingId = searchParams.get("bookingId") || searchParams.get("id");

	// Single state for all charging related data
	const [loading, setLoading] = useState(true);
	const [isStoppingCharge, setIsStoppingCharge] = useState(false);
	const [chargingData, setChargingData] = useState<ChargingData | null>(null);
	const [bookingDetails, setBookingDetails] = useState<VehicleCharging | null>(null);
	const isStoppingRef = useRef(isStoppingCharge);

	const { isNative, user } = Stores();
	const { walletBalance } = useWallet();

	const handleWalletFunctionality = useCallback(
		async (date: string, amount: number = 0) => {
			try {
				const walletBody = {
					user: user.id,
					amount: amount,
					total_balance: Number(walletBalance || 0) - amount,
					date: date,
					description: "Charge payment",
					type: "debit",
				};

				const res = await saveTransaction({ body: walletBody });

				if (res.err) {
					toast.error("Cannot save transaction");
					return false;
				}
				return true;
			} catch (error) {
				toast.error("Something went wrong");
				return false;
			}
		},
		[user, walletBalance]
	);

	const handleStopCharge = useCallback(async (bookingData?: VehicleCharging) => {
		console.log("Stopping charge...", { isStoppingCharge, bookingDetails: !!bookingDetails });

		if (isStoppingCharge) {
			console.log("Already stopping, returning early");
			return;
		}

		const currentBooking = bookingData || bookingDetails;
		if (!currentBooking) {
			console.log("No booking details available");
			toast.error("No booking data available");
			return;
		}

		if (currentBooking.status !== "active") {
			console.log("Booking is not active, status:", currentBooking.status);
			toast.error("Charging session is not active");
			return;
		}

		setIsStoppingCharge(true);
		console.log("Starting stop charge process...");

		try {
			const transactionDate = new Date();
			const formattedDate = format(transactionDate, "yyyy-MM-dd HH:mm:ss");

			const slotId = (currentBooking.charging_slot as ChargingSlot).id;
			const slotStatusRes = await getSlotStatus(slotId);

			if (slotStatusRes.err || slotStatusRes.count === 0) {
				console.error("Error fetching slot status:", slotStatusRes.result);
				toast.error("Failed to fetch charging device status");
				return;
			}
			const slot: StationSlot = slotStatusRes.result[0];

			const connectorId = (slot.active_connectors || [])?.[0];
			if (!connectorId) {
				toast.error("No available connector found for this charging device.");
				return;
			}

			const stopChargeRes = await toggleCharging({
				type: "stop",
				deviceId: toUrlSafeBase64(slotId),
				transactionId: currentBooking.charge_txn_id || "",
				connectorId: String(connectorId),
				idTag: String(user.id),
			});

			console.log(`Stop charge response:`, stopChargeRes);
			console.log(`Current slot status:`, slot);
			console.log(`Transaction ID being used:`, currentBooking.charge_txn_id);
			console.log(`Connector ID being used:`, connectorId);

			if (stopChargeRes.err) {
				console.error("Error stopping charge:", stopChargeRes.result);
				toast.error("Failed to stop charging session");
				return;
			}

			const { status, readings = {} } = stopChargeRes.result;
			console.log("Stop charge status:", status);

			// Always force complete the session regardless of hardware response
			const finalReadings = readings.energy ? readings : (currentBooking.final_reading || {});

			const initialEnergy = Number(currentBooking.initial_reading) || 0;
			const currentEnergy = Number(finalReadings?.energy) || 0;
			const energyDelivered = (currentEnergy - initialEnergy) / 1000;
			const pricePerKWH = Number((currentBooking.station as any)?.price_per_kwh || 0);
			const tax = Number((currentBooking.station as any)?.tax) || 1;
			const currentCostWithoutTax = energyDelivered * pricePerKWH;
			const currentCostWithTax = currentCostWithoutTax * tax;
			const price = Math.round(currentCostWithTax * 100) / 100;

			// Update device connector status
			await updateStationsSlots({
				id: slotId,
				body: {
					active_connectors: (slot.active_connectors || []).filter(connector => connector !== connectorId),
				},
			});

			// Update booking status to completed
			const updateRes = await updateVehicleCharging({
				id: currentBooking.id,
				body: {
					status: "completed",
					stopped_at: formattedDate,
					final_amount: price,
					final_reading: finalReadings,
				},
			});

			if (updateRes.err) {
				console.log("Booking update failed");
				toast.error("Failed to update booking status");
				return;
			}

			const isWalletUpdated = await handleWalletFunctionality(formattedDate, price);

			if (!isWalletUpdated) {
				console.log("Wallet update failed");
				toast.error("Failed to update wallet");
				return;
			}

			console.log("Charging stopped successfully, navigating to invoice");
			toast.success("Charging stopped successfully");
			router.push(`/charge/invoice?id=${currentBooking.id}`);
		} catch (error) {
			console.error("Error stopping charge:", error);
			toast.error("Failed to stop charging session");
		} finally {
			console.log("Setting isStoppingCharge to false");
			setIsStoppingCharge(false);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bookingDetails, chargingData, user, router, handleWalletFunctionality]);

	const handleGetReadings = useCallback(
		async (booking: VehicleCharging) => {
			try {
				const station = booking.station as AdminStation;
				const slotId = (booking.charging_slot as ChargingSlot).id;
				const bookingId = booking.id;

				let { status, reading, transactionId, energyStart }: any = {
					status: "",
					reading: booking.final_reading || {},
					transactionId: booking.charge_txn_id || "",
					energyStart: booking.initial_reading || null,
				};

				console.log("booking", booking);

				if (booking.status === "active") {
					const res = await getReadings(toUrlSafeBase64(slotId), String(user.id));

					console.log("getReadings res", res);

					if (res.err) {
						console.log("res.result", res.result);
						// Hardware stopped - use last known readings instead of completing
						reading = booking.final_reading || {};
						status = "Accepted"; // Keep session active with last known data
						transactionId = booking.charge_txn_id || "";
						energyStart = Number(booking.initial_reading) || energyStart;
					} else {
						status = res.result.status;
						reading = res.result.readings || booking.final_reading || {};
						transactionId = res.result.transactionId || booking.charge_txn_id;
						energyStart = Number(res.result.energyStart) || energyStart;


						if (res.result.energyStop && !isStoppingRef.current) {
							console.log("energyStop detected, auto-stopping charging");
							handleStopCharge(booking);
							return;
						}
					}

					if (status !== "Accepted" && booking.final_reading?.energy) {
						// Hardware is OFF but we have previous readings - use them
						status = "Accepted";
						reading = booking.final_reading;
					} else if (status !== "Accepted") {
						// Hardware is OFF and no previous readings - auto-complete
						await updateVehicleCharging({
							id: bookingId,
							body: { status: "completed", stopped_at: format(new Date(), "yyyy-MM-dd HH:mm:ss") }
						});
						setBookingDetails(prev => prev ? { ...prev, status: "completed" } : null);
						return;
					}
				}

				const body: Partial<VehicleCharging> = {
					charge_txn_id: transactionId,
					last_updated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
				};

				let isStarting = false;

				if (booking.initial_reading === null && energyStart) {
					isStarting = true;
					body.initial_reading = energyStart;
					setBookingDetails(prev => {
						if (!prev) return null;

						return {
							...prev,
							initial_reading: energyStart,
						};
					});
				} else {
					isStarting = false;
				}

				body.final_reading = reading;

				const initialEnergy = Number(booking.initial_reading) || 0; // in Wh
				const currentEnergy = Number(reading?.energy) || initialEnergy; // Fallback to initial if no reading
				const pricePerKWH = Number(station?.price_per_kwh || 10); // Price per kWh, default ₹10

				// Ensure we don't calculate negative energy or cost
				const energyDelivered = Math.max(0, (currentEnergy - initialEnergy) / 1000); // Convert Wh to kWh
				const currentCostWithoutTax = energyDelivered * pricePerKWH;
				const tax = Number(station.tax) || 1; // station tax multiplier or 1
				const currentCostWithTax = currentCostWithoutTax * tax; // apply tax

				// Use previous cost if calculation results in 0 and we had a previous cost
				let currentCost = Math.round(currentCostWithTax * 100) / 100;
				if (currentCost === 0 && chargingData?.pricing?.currentCost > 0 && !isStarting) {
					currentCost = chargingData.pricing.currentCost; // Keep previous cost
				}

				console.log({
					tax: tax,
					initialEnergy,
					currentEnergy,
					pricePerKWH,
					energyDelivered,
					currentCostWithoutTax,
					currentCostWithTax,
					currentCost,
				});

				setChargingData(prev => {
					if (!prev) return null;

					return {
						...prev,
						charging: {
							...prev.charging,
							energyDelivered: energyDelivered,
							txnId: transactionId,
							power: reading?.power || prev.charging.power || 0,
						},
						pricing: {
							...prev.pricing,
							currentCost: Math.max(currentCost, prev.pricing.currentCost), // Never decrease cost
						},
					};
				});

				console.log("body", body);

				if (booking.status === "active") {
					const updateRes = await updateVehicleCharging({
						id: bookingId,
						body: body,
					});
					console.log(`Update booking response:`, updateRes);
				}
			} catch (error) {
				console.log("Error fetching charging data:", error);
				// toast.error("Failed to load charging session data");
			}
		},
		[user]
	);

	useEffect(() => {
		const fetchChargingData = async () => {
			try {
				setLoading(true);

				if (!bookingId) {
					toast.error("No booking ID provided");
					router.replace("/bookings");
					return;
				}

				// Fetch booking details from API
				const res = await getVehiclesChargings({
					search: `id:${bookingId}`,
					joins: "charging_slot:stations_slots,station:stations,vehicle:vehicles",
				});

				if (res.err || res.count === 0) {
					toast.error("Charging session not found");
					router.replace("/bookings");
					return;
				}

				const booking = res.result[0];

				setBookingDetails(booking);

				const transformedData = transformBookingToChargingData(booking);
				const updatedData = calculateChargingData(transformedData, booking);

				setChargingData(updatedData);

				handleGetReadings(booking);
			} catch (error) {
				console.error("Error fetching charging data:", error);
				toast.error("Failed to load charging session data");
			} finally {
				setLoading(false);
			}
		};

		fetchChargingData();
	}, [bookingId, router, handleGetReadings]);

	useEffect(() => {
		if (!bookingDetails) return;
		if (bookingDetails.status !== "active") return;

		let intervalId: number | null = null;

		// Fetch readings every 30 seconds for real-time updates
		intervalId = window.setInterval(() => {
			if (!isStoppingCharge) {
				handleGetReadings(bookingDetails);
			}
		}, 3000); // 30 seconds

		return () => {
			if (intervalId !== null) {
				clearInterval(intervalId);
			}
		};
	}, [handleGetReadings, bookingDetails, isStoppingCharge]);

	useEffect(() => {
		isStoppingRef.current = isStoppingCharge;
	}, [isStoppingCharge]);

	useEffect(() => {
		if (!chargingData || !bookingDetails) return;
		if (bookingDetails.status !== "active") return;

		const timer = setInterval(() => {
			setChargingData(prev => {
				if (!prev) return null;

				const updatedData = calculateChargingData(prev, bookingDetails);

				// Stop the timer when booked duration is reached OR vehicle is fully charged
				const totalDurationSeconds = bookingDetails.duration_in_minute * 60;
				const isTimeUp = updatedData.charging.elapsedTime >= totalDurationSeconds;
				const isFullyCharged = updatedData.charging.percentage >= 100;

				if (!isStoppingRef.current && (isTimeUp || isFullyCharged)) {
					clearInterval(timer);
					handleStopCharge();
				}

				return updatedData;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [chargingData, bookingDetails, handleStopCharge]);

	const formatTime = (seconds: number) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	function handleNavigate() {
		if (!chargingData) return;

		const { latitude, longitude } = chargingData.location.coordinates;
		const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

		if (isNative) {
			sendToNative({ type: "url", url: url });
		} else {
			window.open(url, "_blank");
		}
	}

	// Show loading state
	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="animate-spin h-8 w-8">
					<Icons.ClockIcon className="h-8 w-8" />
				</div>
			</div>
		);
	}

	// Show error state if no data
	if (!chargingData) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4">
				<p>No charging session found</p>
				<Button onClick={() => router.replace("/bookings")}>Go to Bookings</Button>
			</div>
		);
	}

	return (
		<>
			<Header
				left={
					<Button className="p-0 m-0" variant="link" onClick={() => router.replace("/bookings")}>
						<Icons.ArrowLeftIcon />
					</Button>
				}
				right={
					bookingDetails ? (
						<Button
							variant="secondary"
							className="fixed top-5 z-50 !w-fit right-5 rounded-full bg-opacity-5 backdrop-blur-sm"
							onClick={() => handleGetReadings(bookingDetails)}
						>
							<Icons.RefreshCcwIcon className="h-5 w-5" />
							Refresh Readings
						</Button>
					) : null
				}
				headerBackground="bg-background/30 backdrop-blur-md"
			/>

			<Layout className="pt-20">
				<Card className="mb-4">
					<CardContent className="p-4">
						<div className="grid grid-cols-2 gap-4 mb-4">
							<div>
								<h3 className="text-sm text-muted-foreground">Device ID</h3>
								<p className="font-bold">{toUrlSafeBase64(chargingData.station.slotId)}</p>
								<div className="flex items-center gap-2 mt-1">
									<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
										{chargingData.station.slot}
									</span>
									<span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
										{chargingData.station.connectorType}
									</span>
								</div>
							</div>
							<div className="text-right">
								<p className="text-sm text-muted-foreground">Current Cost</p>
								<p className="font-bold text-xl">{formatCurrency(chargingData.pricing.currentCost)}</p>
								<p className="block text-xs font-normal text-muted-foreground"> (Incl. tax)</p>
								<p className="text-sm text-muted-foreground">
									{chargingData.pricing.currency}
									{chargingData.pricing.costPerUnit}/kWh
								</p>
							</div>
						</div>

						<div className="space-y-2 mb-4">
							<div className="flex justify-between items-end">
								<div>
									<h3 className="text-4xl font-bold">{chargingData.charging.percentage}%</h3>
									<p className="text-xs text-muted-foreground">Session Progress</p>
								</div>
								<div className="text-right">
									<p className="text-xs text-muted-foreground">Estimated Time Remaining</p>
									<p className="text-lg font-semibold text-primary">
										{chargingData.charging.estimatedTimeRemaining}
									</p>
								</div>
							</div>
							<CustomProgress value={chargingData.charging.percentage} className="h-3" />
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>Start</span>
								<span>End</span>
							</div>
						</div>

						<div className="mb-4">
							{(() => {
								const statusConfig = getStatusConfig(bookingDetails?.status || "scheduled");

								return (
									<div
										className={cn(
											"flex items-center justify-between p-3 rounded-lg border",
											statusConfig.background
										)}
									>
										<div className="flex items-center gap-3">
											<div className="relative">
												<div className={cn("w-3 h-3 rounded-full", statusConfig.indicatorColor)}></div>
												{statusConfig.showAnimation && (
													<div
														className={cn(
															"absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75",
															statusConfig.indicatorColor
														)}
													></div>
												)}
											</div>
											<div>
												<p className={cn("text-sm font-medium", statusConfig.textColor)}>
													{statusConfig.label}
												</p>
												<p className={cn("text-xs", statusConfig.lightTextColor)}>
													{/* {bookingDetails?.status === "scheduled"
														? `Scheduled for ${chargingData.charging.startedAt}`
														: `Started at ${chargingData.charging.startedAt}`} */}
													{(() => {
														switch (bookingDetails?.status) {
															case "scheduled":
																return "Scheduled For";
															case "active":
															case "completed":
																return "Started At";
															case "cancelled":
																return "Start Time";
															default:
																return "Start Time";
														}
													})()}{" "}
													{chargingData.charging.startedAt}
												</p>
											</div>
										</div>
										<div className="text-right">
											<div className="flex items-center gap-1 mb-1">
												<span className={statusConfig.textColor}>{statusConfig.icon}</span>
												<p className={cn("text-sm font-bold", statusConfig.textColor)}>
													{bookingDetails?.status === "scheduled"
														? "Pending"
														: bookingDetails?.status === "cancelled"
															? "Cancelled"
															: formatTime(chargingData.charging.elapsedTime)}
												</p>
											</div>
											<p className={cn("text-xs", statusConfig.lightTextColor)}>
												{bookingDetails?.status === "scheduled" || bookingDetails?.status === "cancelled"
													? "Status"
													: "Elapsed"}
											</p>
										</div>
									</div>
								);
							})()}
						</div>

						<div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
							<div className="flex items-center gap-2 mb-2">
								<Icons.InfoIcon className="w-4 h-4 text-blue-600" />
								<p className="text-sm font-medium text-blue-800">Session Details</p>
							</div>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<p className="text-blue-600">Booking ID</p>
									<p className="font-medium text-blue-800">#{bookingDetails?.id}</p>
								</div>
								<div>
									<p className="text-blue-600">Device Power</p>
									<p className="font-medium text-blue-800">
										{(bookingDetails?.charging_slot as any).power || 0} kW
									</p>
								</div>
								<div>
									<p className="text-blue-600">Duration Booked</p>
									<p className="font-medium text-blue-800">
										{Math.floor((bookingDetails?.duration_in_minute || 0) / 60) > 0
											? `${Math.floor((bookingDetails?.duration_in_minute || 0) / 60)}h ${(bookingDetails?.duration_in_minute || 0) % 60
											}m`
											: `${bookingDetails?.duration_in_minute || 0}m`}
									</p>
								</div>
								<div>
									<p className="text-blue-600">Expected End</p>
									<p className="font-medium text-blue-800">{chargingData.charging.expectedEndAt}</p>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							{[
								{
									label: "Time Elapsed",
									value: formatTime(chargingData.charging.elapsedTime),
									icon: <Icons.ClockIcon className="h-4 w-4" />,
									color: "text-blue-500",
								},
								{
									label: "Power Output",
									value: `${chargingData.charging.power} kW`,
									icon: <Icons.BoltIcon className="h-4 w-4" />,
									color: "text-yellow-500",
								},
								{
									label: "Energy Delivered",
									value: `${chargingData.charging.energyDelivered.toFixed(2)} kWh`,
									icon: <Icons.BatteryChargingIcon className="h-4 w-4" />,
									color: "text-green-500",
								},
								{
									label: "Cost per kWh",
									value: formatCurrency(chargingData.pricing.costPerUnit),
									icon: <Icons.WalletIcon className="h-4 w-4" />,
									color: "text-purple-500",
								},
							].map((stat, i) => (
								<Card key={i} className="p-3">
									<div className="flex items-center justify-between">
										<div>
											<div className="flex items-center gap-2 mb-1">
												<span className={`${stat.color}`}>{stat.icon}</span>
												<span className="text-xs text-muted-foreground">{stat.label}</span>
											</div>
											<p className="font-semibold text-lg">{stat.value}</p>
										</div>

										{(i === 1 || i === 2) && bookingDetails && bookingDetails.status === "active" ? (
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleGetReadings(bookingDetails!)}
											>
												<Icons.RefreshCcwIcon className="h-4 w-4" />
											</Button>
										) : null}
									</div>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="mb-4">
					<CardContent className="p-4">
						<div className="flex gap-4">
							<Image
								src={
									chargingData.vehicle.image
										? process.env.NEXT_PUBLIC_IMAGE_URL! + chargingData.vehicle.image
										: "/assets/images/car.jpg"
								}
								alt="car"
								width={100}
								height={80}
								onError={e => (e.currentTarget.src = "/assets/images/car.jpg")}
								className="rounded-lg object-contain border"
							/>
							<div className="flex-1">
								<div>
									<p className="font-bold">{chargingData.vehicle.name}</p>
									{/* <p className="text-sm text-muted-foreground">Battery ID: {chargingData.vehicle.id}</p> */}
								</div>
								<div className="grid grid-cols-2 gap-2 mt-2">
									<div className="text-sm">
										<p className="text-muted-foreground">Battery Capacity</p>
										<p className="font-medium">{chargingData.vehicle.batteryCapacity} kW</p>
									</div>
									<div className="text-sm">
										<p className="text-muted-foreground">Max Range</p>
										<p className="font-medium">{chargingData.vehicle.maxRange} km</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 pb-24">
					<Card>
						<CardContent className="p-4">
							<h3 className="font-semibold mb-3">Charging Details</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">
										{(() => {
											switch (bookingDetails?.status) {
												case "scheduled":
													return "Scheduled For";
												case "active":
												case "completed":
													return "Started At";
												case "cancelled":
													return "Start Time";
												default:
													return "Start Time";
											}
										})()}
									</p>
									<p className="font-medium">{chargingData.charging.startedAt}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										{(() => {
											switch (bookingDetails?.status) {
												case "scheduled":
													return "Expected Start";
												case "active":
													return "Expected End";
												case "completed":
													return "Completed At";
												case "cancelled":
													return "End Time";
												default:
													return "Expected End";
											}
										})()}
									</p>
									<p className="font-medium">
										{(() => {
											switch (bookingDetails?.status) {
												case "scheduled":
													return chargingData.charging.startedAt; // For scheduled, show the same start time
												case "active":
													return chargingData.charging.expectedEndAt;
												case "completed":
													return format(bookingDetails?.stopped_at || new Date(), "dd MMM, hh:mm a");
												case "cancelled":
													return chargingData.charging.expectedEndAt;
												default:
													return chargingData.charging.expectedEndAt;
											}
										})()}
									</p>
								</div>
							</div>

							{/* Additional status-specific information */}
							{bookingDetails?.status === "cancelled" &&
								chargingData?.pricing?.refundedAmount &&
								chargingData?.pricing?.refundedAmount > 0 ? (
								<div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
									<div className="flex items-center gap-2 mb-2">
										<Icons.RefreshCcwIcon className="w-4 h-4 text-red-600" />
										<p className="text-sm font-medium text-red-800">Refund Information</p>
									</div>
									<p className="text-sm text-red-600">
										Refunded Amount:{" "}
										<span className="font-medium">
											{formatCurrency(chargingData?.pricing?.refundedAmount)}
										</span>
									</p>
								</div>
							) : null}

							{/* {bookingDetails?.status === "completed" &&
							chargingData?.pricing?.refundedAmount &&
							chargingData?.pricing?.refundedAmount > 0 ? (
								<div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
									<div className="flex items-center gap-2 mb-2">
										<Icons.CheckIcon className="w-4 h-4 text-green-600" />
										<p className="text-sm font-medium text-green-800">Session Completed</p>
									</div>
									<p className="text-sm text-green-600">
										Unused Amount Refunded:{" "}
										<span className="font-medium">
											{formatCurrency(chargingData?.pricing?.refundedAmount)}
										</span>
									</p>
								</div>
							) : null} */}

							{bookingDetails?.status === "scheduled" && (
								<div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
									<div className="flex items-center gap-2 mb-2">
										<Icons.ClockIcon className="w-4 h-4 text-blue-600" />
										<p className="text-sm font-medium text-blue-800">Upcoming Session</p>
									</div>
									<p className="text-sm text-blue-600">
										Your charging session will begin at the scheduled time. Please arrive 5-10 minutes early.
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<h3 className="font-semibold mb-3">Location</h3>
							<div className="flex gap-3">
								<div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
									<Icons.MapPinIcon className="h-8 w-8 text-muted-foreground" />
								</div>
								<div className="flex-1">
									<p className="font-medium">{chargingData.location.name}</p>
									<p className="text-sm text-muted-foreground">{chargingData.location.address}</p>
									<Button variant="link" className="h-auto p-0 text-primary" onClick={handleNavigate}>
										Get Directions
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{bookingDetails?.status === "active" && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<div className="fixed bottom-tab left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
								<Button
									isLoading={isStoppingCharge}
									variant="destructive"
									className="w-full rounded-full"
									size="lg"
								>
									<Icons.PowerIcon className="mr-2 h-4 w-4" />
									Stop Charging
								</Button>
							</div>
						</AlertDialogTrigger>
						<AlertDialogContent className="w-[90%] rounded-2xl overflow-hidden p-0 pt-6">
							<AlertDialogHeader>
								<div>
									<Icons.PowerIcon className="w-20 mx-auto" />
								</div>
								<AlertDialogTitle className="font-bold text-center">
									Do you want to stop charging?
								</AlertDialogTitle>
								<AlertDialogDescription className="text-center">
									Some description discontinue warning message
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter className="flex flex-row shadow-[0_-10px_60px_15px_rgba(0,0,0,0.15)] mt-4">
								{" "}
								<AlertDialogAction
									onClick={handleStopCharge}
									disabled={isStoppingCharge}
									className="text-destructive hover:bg-gray-200 bg-white inline-block w-1/2 h-14"
								>
									{isStoppingCharge ? "Stopping..." : "Yes! Stop"}
								</AlertDialogAction>
								<AlertDialogCancel className="mt-0 inline-block w-1/2 border-0 h-14">
									No! Continue
								</AlertDialogCancel>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</Layout>

			{/* {bookingDetails ? (
				<Button
					variant="secondary"
					className="fixed top-5 z-50 !w-fit right-5 rounded-full bg-opacity-5 backdrop-blur-sm"
					onClick={() => handleGetReadings(bookingDetails)}
				>
					<Icons.RefreshCcwIcon className="h-5 w-5" />
					Refresh Readings
				</Button>
			) : null} */}
		</>
	);
};

export default ChargingStatusPage;
