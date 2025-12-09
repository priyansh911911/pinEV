"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import Transition from "@/components/custom/transition";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Stores from "@/lib/stores";
import { Slider } from "@/components/ui/slider";
import { getVehicles } from "@/actions/vehicles";
import CustomDrawer from "@/components/custom/drawer";
import useWallet from "@/hooks/useWallet";
import { saveVehicleCharging } from "@/actions/vehicles-chargings";

const ScannedStationSlot = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const stationSlotId = searchParams.get("id");

	const [duration, setDuration] = useState<number>(15);
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [loadingState, setLoadingState] = useState<"fetchingVehicles" | "idle" | "scheduling">("idle");
	const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
	const [isScheduling, setIsScheduling] = useState(false);
	const [selectedChargingSlot, setSelectedChargingSlot] = useState<Partial<ChargingSlot>>({});

	const { user, isUserLoading, stationData, isStationDataLoading } = Stores();
	const { walletBalance } = useWallet();

	// Current date and time
	const currentDateTime = new Date();

	// Find the charging slot from station data
	useEffect(() => {
		if (stationData && stationSlotId) {
			const slot = stationData.slots?.find(slot => slot.id == stationSlotId);

			if (slot) {
				setSelectedChargingSlot(slot);
			}
		}
	}, [stationData, stationSlotId]);

	const handleGetVehicles = useCallback(async () => {
		setLoadingState("fetchingVehicles");

		try {
			const res = await getVehicles({ search: `user:${user.id}` });
			if (res.err) {
				return;
			}

			const vehicles: Vehicle[] = res.result.map((vehicle: any) => ({
				id: vehicle.id,
				user: vehicle.user,
				vehicle_number: vehicle.details.vehicle_number,
				vehicle_type: vehicle.details.vehicle_type,
				brand: vehicle.brand,
				model: vehicle.model,
				color: vehicle.color,
				year_of_manufacture: vehicle.details.year_of_manufacture,
				battery_capacity: vehicle.details.battery_capacity,
				range_per_charge: vehicle.details.range_per_charge,
				registration_date: vehicle.details.registration_date,
				last_service_date: vehicle.details.last_service_date,
				is_deleted: vehicle.is_deleted,
				created_at: new Date(vehicle.created_at),
				updated_at: new Date(vehicle.updated_at),
				image: vehicle.image || "",
			}));

			setVehicles(vehicles);
		} catch (error) {
			toast.error("Failed to fetch vehicles.");
		} finally {
			setLoadingState("idle");
		}
	}, [user]);

	useEffect(() => {
		if (isUserLoading) {
			return;
		}
		handleGetVehicles();
	}, [handleGetVehicles, isUserLoading]);

	const renderDurationList = () => {
		const handleDurationClick = (duration: number) => {
			setDuration(duration);
		};

		return (
			<div className="space-y-4">
				<p className="text-lg font-semibold">Choose your preferred time duration</p>

				<div className="space-y-4">
					<div className="flex justify-between text-sm">
						<span>
							{Math.floor((duration || 15) / 60)}h {(duration || 15) % 60}m
						</span>
						<span className="text-muted-foreground">{duration} minutes</span>
					</div>
					<Slider
						min={15}
						max={480}
						step={5}
						value={[duration || 15]}
						onValueChange={value => handleDurationClick(value[0])}
						className="my-4"
					/>
					<div className="flex flex-wrap gap-2">
						{[15, 30, 45, 60, 90, 120].map(dur => (
							<Button
								key={dur}
								type="button"
								variant={dur === duration ? "default" : "outline"}
								className="px-4"
								onClick={() => handleDurationClick(dur)}
							>
								{dur}m
							</Button>
						))}
					</div>
				</div>
			</div>
		);
	};

	const renderVehicleSelect = () => {
		return (
			<div className="space-y-2">
				<p className="text-lg font-semibold">Choose your Vehicle</p>

				<div>
					<CustomDrawer
						title="Select Vehicle"
						value={
							selectedVehicle
								? `${selectedVehicle?.brand} ${selectedVehicle?.model} (${selectedVehicle?.year_of_manufacture})`
								: ""
						}
						className="h-12"
						displayClose
					>
						<div className="max-h-[90vh] overflow-y-auto space-y-4 p-px">
							{vehicles.length > 0 ? (
								vehicles.map(vehicle => (
									<div
										key={vehicle.id}
										className={cn(
											"flex items-center gap-x-4 ring-1 ring-muted-foreground p-4 rounded-xl cursor-pointer transition-colors duration-300",
											{
												"bg-foreground text-white": selectedVehicle?.id === vehicle.id,
											}
										)}
										onClick={() => setSelectedVehicle(vehicle)}
									>
										<Image
											src={
												vehicle.image
													? process.env.NEXT_PUBLIC_IMAGE_URL! + vehicle.image
													: "/assets/images/car.jpg"
											}
											alt={vehicle.brand}
											width={48}
											height={48}
											className="rounded-full"
										/>
										<div className="space-y-1">
											<h1 className="text-lg font-semibold">
												{vehicle.brand} {vehicle.model} ({vehicle.year_of_manufacture})
											</h1>
										</div>
									</div>
								))
							) : (
								<div className="flex flex-col gap-2 items-center justify-center h-64">
									<p className="text-muted-foreground">No vehicles found.</p>
									<Button
										onClick={() =>
											router.push(
												`/vehicles/add?returnTo=${encodeURIComponent(
													`/booking/scanned/station-slot?slotId=${stationSlotId}`
												)}`
											)
										}
										variant="outline"
										leftIcon={<Icons.AddIcon className="h-4 w-4" />}
									>
										Add Vehicle
									</Button>
								</div>
							)}

							<div className="h-8" />
						</div>
					</CustomDrawer>
				</div>
			</div>
		);
	};

	const handleSchedule = async () => {
		if (!duration || !selectedVehicle || !stationSlotId) {
			toast.error("Please select all required fields before scheduling.");
			return;
		}

		setIsScheduling(true);

		try {
			const amount = finalPrice + taxAmount;

			if (walletBalance < amount) {
				toast.error("Insufficient wallet balance to schedule the charging device.");
				return;
			}

			const bookingData = {
				datetime: formatDate("YYYY-MM-DD HH:mm:ss", currentDateTime),
				user: user.id,
				vehicle: selectedVehicle?.id,
				station: stationData?.id,
				charging_slot: stationSlotId,
				duration_in_minute: duration,
				amount_paid: amount,
				status: "scheduled",
			};

			const res = await saveVehicleCharging({ body: bookingData });

			if (res.err) {
				toast.error("Failed to schedule the charging device.");
				return;
			}

			toast.success("Charging device scheduled successfully!");
			router.push(`/booking/scanned?bookingId=${res.result.lastInsertID}`);
		} catch (error) {
			console.error("Error scheduling:", error);
			toast.error("Failed to schedule the charging device.");
		} finally {
			setIsScheduling(false);
		}
	};

	const finalPrice = useMemo(
		() => Number((selectedChargingSlot?.price_per_minute || 0) * duration),
		[selectedChargingSlot, duration]
	);
	const taxAmount = useMemo(() => Number(finalPrice * ((stationData?.tax || 0) / 100)), [finalPrice, stationData?.tax]);

	const isButtonShow = duration && selectedVehicle && selectedChargingSlot?.id;

	// Show loading or redirect if no station data
	if (isStationDataLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Icons.LoadingIcon className="h-8 w-8 animate-spin" />
					<p>Loading station details...</p>
				</div>
			</div>
		);
	}

	if (!stationData || !stationSlotId || !selectedChargingSlot?.id) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4">
				<Icons.AlertTriangleIcon className="h-12 w-12 text-red-500" />
				<p className="text-center">Station or charging device not found</p>
				<Button onClick={() => router.push("/home")}>Go to Home</Button>
			</div>
		);
	}

	return (
		<>
			<Transition>
				<Header
					left={
						<Button onClick={() => router.back()} variant="link" className="p-0 m-0 text-foreground">
							<Icons.ArrowLeftIcon />
						</Button>
					}
					headerBackground="bg-background"
				>
					<h1 className="text-lg font-semibold text-foreground">Quick Charge | {stationData?.name || "..."}</h1>
				</Header>

				<Layout className="pt-32 space-y-8">
					{/* Current Date & Time Display */}
					<div className="bg-primary/10 p-4 rounded-xl">
						<h2 className="text-lg font-semibold mb-2">Charging Session</h2>
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">Start Time</p>
							<p className="font-semibold text-lg">{formatDate("DD MMM YYYY, hh:mm A", currentDateTime)}</p>
						</div>
					</div>

					{/* Selected Charging Slot Display */}
					{selectedChargingSlot?.id && (
						<div className="bg-muted/30 p-4 rounded-xl">
							<h3 className="text-lg font-semibold mb-3">Selected Charging Device</h3>
							<div className="flex items-center gap-x-4">
								<Image src="/assets/images/charger.svg" alt="charger" width={32} height={32} />
								<div className="space-y-1">
									<h1 className="text-lg font-semibold">{selectedChargingSlot.name}</h1>
									<div className="flex items-center gap-x-6 text-sm text-neutral-500">
										<h3 className="flex items-center gap-x-2">
											<Icons.BatteryIcon className="w-4 h-auto" />
											<span>{selectedChargingSlot.power} kW</span>
										</h3>
										<h3 className="flex items-center gap-x-2">
											<Icons.ActivityIcon className="w-4 h-auto" />
											<span>{selectedChargingSlot.connector_type}</span>
										</h3>
									</div>
								</div>
							</div>
						</div>
					)}

					{renderDurationList()}

					{renderVehicleSelect()}

					<div className="h-10"></div>
				</Layout>

				{isButtonShow && (
					<div className="fixed bottom-0 left-0 w-full bg-background rounded-t-xl shadow-[0_0_10px_rgba(0,0,0,0.25)]">
						<div className="default-page-width py-6">
							<div className="space-y-2 mb-4">
								<h1 className="font-semibold text-xl">
									Quick Charge: {formatDate("DD MMM, YYYY", currentDateTime)}
								</h1>
								<h1 className="font-bold text-xl text-primary">
									{formatDate("hh:mm A", currentDateTime)} - {duration} Min{" "}
									{Math.floor(duration / 60) > 0 ? `(${Math.floor(duration / 60)}h ${duration % 60}m)` : ""}
								</h1>
								{/* <div className="flex items-center gap-x-2">
									<h1 className="font-bold text-xl">
										Amount: {formatCurrency(finalPrice + taxAmount)}{" "}
										<span className="font-normal text-sm text-muted-foreground">
											(Incl. of {stationData?.tax}% Tax)
										</span>
									</h1>
								</div> */}
							</div>

							<CustomDrawer
								title={<span>Proceed</span>}
								displayClose
								className="active:scale-95 transition duration-200 inline-flex gap-2 items-center justify-center whitespace-nowrap font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-xl px-8 w-full rounded-3xl"
								placeholder="Schedule Now"
								description="Schedule your charging device now."
							>
								<div className="space-y-6 p-1 mb-4 max-h-[90vh] overflow-y-auto">
									<div className="space-y-3">
										<h3 className="font-semibold text-lg">Booking Summary</h3>

										<div className="bg-muted/40 p-3 rounded-lg">
											<div className="flex items-center justify-between mb-2">
												<span className="text-sm font-medium">Duration</span>
												<span className="text-sm font-bold">
													{Math.floor(duration / 60) > 0
														? `${Math.floor(duration / 60)}h ${duration % 60}m`
														: `${duration}m`}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">Start Time</span>
												<span className="text-sm font-bold">
													{formatDate("DD MMM, hh:mm A", currentDateTime)}
												</span>
											</div>
										</div>
									</div>

									<div className="space-y-3">
										<h3 className="font-semibold text-lg">Pricing</h3>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm">Rate per kWh</p>
													<p className="text-xs text-muted-foreground">
														{selectedChargingSlot.name || "Selected Device"}
													</p>
												</div>
												<span className="font-semibold">
													{formatCurrency(stationData?.price_per_kwh || 0)}/kWh
												</span>
											</div>

											{/* <div className="border-t border-border pt-3">
												<div className="flex items-center justify-between">
													<p className="text-sm">Base price ({duration} minutes)</p>
													<span className="font-semibold">{formatCurrency(finalPrice)}</span>
												</div>

												{(stationData?.tax || 0) > 0 && (
													<div className="flex items-center justify-between mt-1">
														<p className="text-sm">Tax ({stationData?.tax}%)</p>
														<span className="font-semibold">{formatCurrency(taxAmount)}</span>
													</div>
												)}

												<div className="flex items-center justify-between mt-3 border-t border-border pt-3">
													<p className="text-base font-medium">Total Amount</p>
													<span className="text-primary font-bold text-lg">
														{formatCurrency(finalPrice + taxAmount)}
													</span>
												</div>
											</div> */}
										</div>
									</div>

									<div className="space-y-3">
										<h3 className="font-semibold text-lg">Charging Estimation</h3>

										<div className="bg-primary/10 p-3 rounded-lg">
											<div className="flex items-center justify-between mb-2">
												<span className="text-sm font-medium">Power</span>
												<span className="text-sm font-bold">{selectedChargingSlot?.power || "-"} kW</span>
											</div>

											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">Est. Energy</span>
												<span className="text-sm font-bold">
													{selectedChargingSlot?.power
														? ((Number(selectedChargingSlot.power) * duration) / 60).toFixed(1)
														: "-"}{" "}
													kW
												</span>
											</div>

											{selectedVehicle?.battery_capacity && (
												<div className="flex items-center justify-between mt-2">
													<span className="text-sm font-medium">Est. % Charged</span>
													<span className="text-sm font-bold">
														{Math.min(
															100,
															Math.round(
																((Number(selectedChargingSlot?.power || 0) * duration) /
																	60 /
																	selectedVehicle.battery_capacity) *
																	100
															)
														)}
														%
													</span>
												</div>
											)}
										</div>

										<p className="text-xs text-muted-foreground italic">
											Actual charging may vary based on vehicle battery condition and charging efficiency.
										</p>
									</div>

									{/* <div className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-sm">Wallet Balance</span>
											<span className="font-medium">{formatCurrency(walletBalance || 0)}</span>
										</div>

										{(walletBalance || 0) < finalPrice + taxAmount && (
											<>
												<div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm flex items-center justify-between">
													<span>
														<Icons.AlertTriangleIcon className="h-4 w-4 inline-block mr-1" />
														Insufficient balance. Please add funds to your wallet.
													</span>

													<Button
														onClick={() =>
															router.push(
																`/wallet?returnTo=${encodeURIComponent(
																	`/booking/scanned/station-slot?slotId=${stationSlotId}`
																)}`
															)
														}
														variant="outline"
														leftIcon={<Icons.AddIcon className="h-4 w-4 text-red-600" />}
													>
														Add
													</Button>
												</div>
											</>
										)}
									</div> */}
									<Button
										onClick={handleSchedule}
										className="w-full rounded-3xl"
										size="xl"
										// disabled={isScheduling || (walletBalance || 0) < finalPrice + taxAmount}
										disabled={isScheduling}
									>
										{isScheduling ? "Scheduling..." : "Schedule Now"}
									</Button>
								</div>
							</CustomDrawer>

							<div className="h-6" />
						</div>
					</div>
				)}
			</Transition>
		</>
	);
};

export default ScannedStationSlot;
