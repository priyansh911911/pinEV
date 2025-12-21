"use client";

import { redirect, useRouter, useSearchParams } from "next/navigation";

import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import Transition from "@/components/custom/transition";
import CustomCalendar from "@/components/custom/calendar";
import FlatList from "@/components/flat-list";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { cn, formatCurrency, formatDate, toUrlSafeBase64 } from "@/lib/utils";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Stores from "@/lib/stores";
import { eachMinuteOfInterval, getDay, isSameDay, isWithinInterval, roundToNearestMinutes } from "date-fns";
import { Slider } from "@/components/ui/slider";
import { getVehicles } from "@/actions/vehicles";
import CustomDrawer, { DrawerClosingButton } from "@/components/custom/drawer";
import useWallet from "@/hooks/useWallet";
import { saveTransaction } from "@/actions/transactions";
import { getVehiclesChargings, saveVehicleCharging } from "@/actions/vehicles-chargings";

type WeekDay = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
const weekDays: WeekDay[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SchedulePage = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const stationId = searchParams.get("id");

	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date>();
	const [selectedChargingSlot, setSelectedChargingSlot] = useState<Partial<ChargingSlot>>({});
	const [isButtonShow, setIsButtonShow] = useState(false);
	const [isScheduling, setIsScheduling] = useState(false);
	const [stationAvailableSlots, setStationAvailableStols] = useState<Date[]>([]);
	const [duration, setDuration] = useState<number>(15);
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [loadingState, setLoadingState] = useState<"fetchingVehicles" | "idle" | "scheduling">("idle");
	const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
	const [bookings, setBookings] = useState<VehicleCharging[]>([]);

	const { user, isUserLoading, stationData, isStationDataLoading } = Stores();
	const { walletBalance } = useWallet();

	useEffect(() => {
		if (selectedDate && selectedTimeSlot && duration && selectedChargingSlot?.id && selectedVehicle) {
			setIsButtonShow(true);
		} else {
			setIsButtonShow(false);
		}
	}, [selectedDate, selectedTimeSlot, selectedChargingSlot, duration, selectedVehicle]);

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

	const handleGetBookings = useCallback(async () => {
		if (!stationId) {
			return;
		}

		try {
			const res = await getVehiclesChargings({
				search: `station:${stationId},status:scheduled`,
				joins: "charging_slot:stations_slots",
			});

			if (res.err) {
				toast.error("Failed to fetch bookings.");
				return;
			}

			setBookings(res.result);
		} catch (error) {
			console.error("Error fetching bookings:", error);
			toast.error("Failed to fetch bookings.");
		}
	}, [stationId]);

	useEffect(() => {
		if (isUserLoading) {
			return;
		}

		handleGetVehicles();
	}, [handleGetVehicles, isUserLoading]);

	useEffect(() => {
		handleGetBookings();
	}, [handleGetBookings]);

	const handleDateChange = (date: Date) => {
		setSelectedDate(date);
		setSelectedTimeSlot(undefined);
	};

	const renderSlot = (slot: ChargingSlot) => {
		const handleSlotClick = () => {
			if (slot.id === selectedChargingSlot.id) {
				return;
			}
			setSelectedChargingSlot(slot);
		};

		return (
			<div className="space-y-4">
				<Label
					onClick={handleSlotClick}
					htmlFor={slot.id}
					className={cn("flex items-center justify-between p-4 rounded-xl ring-1 ring-neutral-200 gap-x-2", {
						"bg-primary/10 ring-ring": slot.id === selectedChargingSlot?.id,
					})}
				>
					<div className="flex items-center gap-x-6">
						<Image src="/assets/images/charger.svg" alt="charger" width={32} height={32} />
						<div className="space-y-2">
							<h1 className="text-lg font-semibold text-neutral-500">#{toUrlSafeBase64(slot.id)}</h1>
							<h1 className="text-lg font-semibold">{slot.name}</h1>

							<div className="flex items-center gap-x-6 text-sm text-neutral-500">
								<h3 className="flex items-center gap-x-2">
									<span>
										<Icons.BatteryIcon className="w-4 h-auto" />
									</span>
									<span>{slot.power} kW</span>
								</h3>
								<h3 className="flex items-center gap-x-2">
									<span>
										<Icons.ActivityIcon className="w-4 h-auto" />
									</span>
									<span>{slot.connector_type}</span>
								</h3>
							</div>
						</div>
					</div>
					<RadioGroupItem value={slot.id} id={slot.id} className="size-6" />
				</Label>

				{/* {renderDurationList()} */}
			</div>
		);
	};

	const renderDurationList = () => {
		const handleDurationClick = (duration: number) => {
			setDuration(duration);
		};

		return (
			<div>
				<p className="text-lg font-semibold">Choose your prefered time duration</p>

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
									<DrawerClosingButton
										key={vehicle.id}
										className={cn(
											"flex items-center gap-x-4 ring-1 ring-muted-foreground p-4 rounded-xl cursor-pointer transition-colors duration-300 h-auto",
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
									</DrawerClosingButton>
								))
							) : (
								<div className="flex flex-col gap-2 items-center justify-center h-64">
									<p className="text-muted-foreground">No vehicles found.</p>
									<Button
										onClick={() =>
											router.push(
												`/vehicles/add?returnTo=${encodeURIComponent(
													`/booking/schedule?id=${stationId}`
												)}`
											)
										}
										variant="outline"
										leftIcon={<Icons.PlusIcon className="h-4 w-4" />}
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

	const renderTimeSlotList = () => {
		return (
			<div className="space-y-2">
				<p className="text-lg font-semibold">Select a Time Slot</p>

				<div>
					<CustomDrawer
						title="Select Time Slot"
						value={selectedTimeSlot ? formatDate("hh:mm A", selectedTimeSlot) : ""}
						className="h-12"
						displayClose
					>
						{selectedChargingSlot.id ? (
							stationAvailableSlots.length ? (
								<div className="max-h-[90vh] overflow-y-auto p-px grid grid-cols-auto-fill gap-2">
									{stationAvailableSlots.map((timeSlot: Date) => {
										const filteredBookings = bookings
											.filter(
												booking =>
													isSameDay(new Date(booking.datetime), timeSlot) &&
													(booking.charging_slot as ChargingSlot).id === selectedChargingSlot?.id
											)
											.map(booking => ({
												start_time: new Date(booking.datetime),
												end_time: new Date(
													new Date(booking.datetime).getTime() +
														booking.duration_in_minute * 60 * 1000 -
														1
												),
											}));

										const isWithinSelectedDuration = filteredBookings.some(booking => {
											const bookingStart = booking.start_time;
											const bookingEnd = booking.end_time;
											const selectedStart = new Date(timeSlot);
											const selectedEnd = new Date(timeSlot.getTime() + duration * 60 * 1000);
											return (
												isWithinInterval(selectedStart, { start: bookingStart, end: bookingEnd }) ||
												isWithinInterval(selectedEnd, { start: bookingStart, end: bookingEnd })
											);
										});

										const isBooked = isWithinSelectedDuration;
										return (
											<DrawerClosingButton
												key={timeSlot.toISOString()}
												onClick={() => !isBooked && setSelectedTimeSlot(timeSlot)}
												className={cn("font-medium rounded-xl border w-full h-12", {
													"cursor-not-allowed bg-secondary": isBooked,
													"bg-primary text-primary-foreground hover:bg-primary/90": selectedTimeSlot?.toISOString() === timeSlot.toISOString() && !isBooked,
												})}
											>
												{formatDate("hh:mm A", timeSlot)}
											</DrawerClosingButton>
										);
									})}
								</div>
							) : (
								<div className="w-full flex flex-col items-center justify-center h-64 p-4 text-center">
									<Icons.AlertTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
									<p className="text-red-500 font-medium">No available time slots for this charging device.</p>
									<p className="text-sm text-muted-foreground/70 mt-2 max-w-xs">
										Please select a different charging device or date.
									</p>
								</div>
							)
						) : (
							<div className="flex flex-col items-center justify-center h-64 p-4 text-center">
								<Icons.InfoIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
								<p className="text-muted-foreground font-medium">
									Please select a charging device first to view available time slots.
								</p>
								<p className="text-sm text-muted-foreground/70 mt-2 max-w-xs">
									Different charging ports may have different availability based on bookings.
								</p>
							</div>
						)}
						<div className="h-8" />
					</CustomDrawer>
				</div>
			</div>
		);
	};

	const handleSchedule = async () => {
		if (!selectedDate || !selectedTimeSlot || !selectedChargingSlot || !duration || !selectedVehicle) {
			toast.error("Please select all required fields before scheduling.");
			return;
		}

		setIsScheduling(true);

		try {
			const amount = finalPrice + taxAmount;

			// TODO: Uncomment for pre-payment functionality
			// if (walletBalance < amount) {
			// 	toast.error("Insufficient wallet balance. Redirecting to add money...");
			// 	router.push(`/wallet?returnTo=${encodeURIComponent(`/booking/schedule?id=${stationId}`)}`);
			// 	return;
			// }

			// const transactionData = {
			// 	user: user.id,
			// 	amount: amount,
			// 	total_balance: walletBalance - amount,
			// 	type: "debit",
			// 	description: `Charge Payment`,
			// 	station: stationId,
			// 	date: formatDate("YYYY-MM-DD HH:mm:ss"),
			// };

			// const transactionRes = await saveTransaction({ body: transactionData });
			// if (transactionRes.err) {
			// 	toast.error("Failed to save transaction.");
			// 	return;
			// }

			const bookingData = {
				datetime: formatDate("YYYY-MM-DD HH:mm:ss", selectedTimeSlot),
				user: user.id,
				vehicle: selectedVehicle?.id,
				station: stationId,
				charging_slot: selectedChargingSlot?.id,
				duration_in_minute: duration,
				amount_paid: 0, // Skip pre-payment
				// transaction: transactionRes.result.lastInsertID, // Skip transaction reference
				status: "scheduled",
			};

			const res = await saveVehicleCharging({ body: bookingData });

			if (res.err) {
				toast.error("Failed to schedule the charging device.");
				return;
			}

			toast.success("Charging device scheduled successfully!");
			router.push(`/booking/success?bookingId=${res.result.lastInsertID}`);
		} catch (error) {
			console.error("Error scheduling:", error);
			toast.error("Failed to schedule the charging device.");
		} finally {
			setIsScheduling(false);
		}
	};

	useEffect(() => {
		if (!stationData && !selectedChargingSlot?.id) {
			return;
		}

		const chargingSlot = stationData?.slots?.find(slot => slot.id === selectedChargingSlot?.id);

		if (!chargingSlot) {
			setStationAvailableStols([]);
			return;
		}

		const chargingSlotStartTime =
			chargingSlot.schedules.find(schedule =>
				schedule.days.some(day => weekDays.findIndex(d => d === day) === getDay(selectedDate))
			)?.start_time || null;

		if (!chargingSlotStartTime) {
			setStationAvailableStols([]);
			return;
		}

		const day = selectedDate ? new Date(selectedDate) : new Date();
		const slotStartTime = isSameDay(selectedDate, new Date())
			? formatDate("HH:mm", roundToNearestMinutes(new Date(), { nearestTo: 30, roundingMethod: "ceil" }))
			: chargingSlotStartTime;
		const slotEndTime = stationData?.details?.end_time || "23:59";

		const startTime = day.setHours(Number(slotStartTime.split(":")[0]), Number(slotStartTime.split(":")[1]), 0, 0);
		const endTime = day.setHours(Number(slotEndTime.split(":")[0]), Number(slotEndTime.split(":")[1]), 0, 0);

		const timeIntervals = eachMinuteOfInterval({ start: startTime, end: endTime }, { step: 30 });

		const availableSlots = selectedDate ? timeIntervals.filter(time => isSameDay(time, selectedDate)) : [];
		setStationAvailableStols(availableSlots);
	}, [stationData, selectedDate, selectedChargingSlot]);

	const finalPrice = useMemo(() => {
		const pricePerMinute = 1; // ₹1 per minute
		return Number(duration * pricePerMinute);
	}, [duration]);
	const taxAmount = useMemo(() => Number(finalPrice * ((stationData?.tax || 0) / 100)), [finalPrice, stationData?.tax]);

	if (!isStationDataLoading && !stationData) {
		redirect("/home");
	}

	return (
		<>
			<Transition>
				<Header
					left={
						<Button onClick={() => router.back()} variant="link" className="p-0 m-0 text-background">
							<Icons.ArrowLeftIcon />
						</Button>
					}
					// right={
					// 	<Button variant="link" size="icon" className="p-0 m-0 text-background">
					// 		<Icons.ThreeDotIcon />
					// 	</Button>
					// }
					headerBackground="bg-foreground"
				>
					<h1 className="text-lg font-semibold text-background">Schedule | {stationData?.name || "..."}</h1>
				</Header>

				<Layout fullWidth className="pt-24 bg-foreground rounded-b-xl overflow-hidden">
					<CustomCalendar className="bg-foreground" selectedDate={selectedDate} onSelectChange={handleDateChange} />
				</Layout>

				<Layout className="space-y-8 mt-6">
					<div className="space-y-4">
						<p className="text-lg font-semibold">Select Charging Device</p>

						<RadioGroup className="space-y-6">
							<FlatList
								data={stationData?.slots || []}
								keyExtractor={chargingSlot => chargingSlot.id}
								renderItem={renderSlot}
							/>
						</RadioGroup>
					</div>

					{renderDurationList()}

					{renderTimeSlotList()}

					{renderVehicleSelect()}

					<div className="h-10"></div>
				</Layout>

				{isButtonShow && (
					<div className="fixed bottom-[env(safe-area-inset-bottom)] left-0 w-full bg-background rounded-t-xl shadow-[0_0_10px_rgba(0,0,0,0.25)]">
						<div className="default-page-width py-6">
							<div className="space-y-2 mb-4">
								<h1 className="font-semibold text-xl">
									Your Booking Slot: {formatDate("DD MMM, YYYY", selectedDate)}
								</h1>
								<h1 className="font-bold text-xl text-primary">
									{formatDate("hh:mm A", selectedTimeSlot)} - {duration} Min{" "}
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

							{/* <Button onClick={handleSchedule} className="w-full rounded-3xl" size="xl">
								Schedule
							</Button> */}

							<CustomDrawer
								title={<span>Proceed</span>}
								displayClose
								className="active:scale-95 transition duration-200 inline-flex gap-2 items-center justify-center whitespace-nowrap font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-xl px-8 w-full rounded-3xl"
								placeholder="Schedule"
								description="Schedule your charging device."
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
												<span className="text-sm font-medium">Date & Time</span>
												<span className="text-sm font-bold">
													{selectedTimeSlot ? formatDate("DD MMM, hh:mm A", selectedTimeSlot) : "-"}
												</span>
											</div>
										</div>
									</div>

									<div className="space-y-3">
										<h3 className="font-semibold text-lg">Pricing </h3>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm">Rate per minute</p>
													<p className="text-xs text-muted-foreground">
														{selectedChargingSlot.name || "Selected Device"}
													</p>
												</div>
												<span className="font-semibold">
													₹1.00/min
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
																	`/booking/schedule?id=${stationId}`
																)}`
															)
														}
														variant="outline"
														leftIcon={<Icons.PlusIcon className="h-4 w-4 text-red-600" />}
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
										{isScheduling ? "Scheduling..." : "Schedule Booking"}
									</Button>
								</div>
							</CustomDrawer>
						</div>
					</div>
				)}
			</Transition>
		</>
	);
};

export default SchedulePage;
