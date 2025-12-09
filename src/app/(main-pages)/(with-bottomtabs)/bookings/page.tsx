"use client";
import Image from "next/image";
import Stores from "@/lib/stores";
import Layout from "@/components/layout";
import { formatDate } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { useRouter, useSearchParams } from "next/navigation";
import FlatList from "@/components/flat-list";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import BookingCard from "@/components/custom/booking-card";
import { useState, useMemo, useCallback, useEffect } from "react";
import { getVehiclesChargings } from "@/actions/vehicles-chargings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWallet from "@/hooks/useWallet";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const FutureBookings = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("tab") || "upcoming";

	const [isLoading, setIsLoading] = useState(false);
	const [bookings, setBookings] = useState<VehicleCharging[]>([]);
	const [currentTime, setCurrentTime] = useState(new Date());

	const { user } = Stores();
	const { walletBalance } = useWallet();

	const handleGetBookings = useCallback(async () => {
		setIsLoading(true);

		try {
			const now = new Date();
			const formattedNow = formatDate("YYYY-MM-DD HH-mm-ss", now);
			const dateFilter =
				activeTab === "upcoming" ? `datetime>${formattedNow}` : `(datetime<${formattedNow}|status:completed)`;
			const statusFilter = activeTab === "upcoming" ? ",(status:scheduled|status:active|status:cancelled)" : "";

			const res = await getVehiclesChargings({
				search: `user:${user.id},${dateFilter}${statusFilter}`,
				joins: "charging_slot:stations_slots,station:stations,vehicle:vehicles",
			});

			if (res.err) {
				return console.error("Error fetching bookings:", res.result);
			}

			setBookings(res.result);
		} catch (error) {
			console.error("Failed to fetch bookings:", error);
		} finally {
			setIsLoading(false);
		}
	}, [user, activeTab]);

	useEffect(() => {
		if (user?.id) {
			handleGetBookings();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.id, activeTab]);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const calculateRemainingTime = useCallback(
		(booking: VehicleCharging) => {
			const totalChargeDurationMs = booking.duration_in_minute * 60 * 1000;
			const startTimeMs = new Date(booking.started_at || new Date()).getTime();
			const nowMs = currentTime.getTime();
			const elapsedTimeMs = nowMs - startTimeMs;
			let remainingTimeMs = totalChargeDurationMs - elapsedTimeMs;

			if (remainingTimeMs < 0) remainingTimeMs = 0;

			const hours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
			const minutes = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((remainingTimeMs % (1000 * 60)) / 1000);

			return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
		},
		[currentTime]
	);

	const activeBookings: ({ remaining_time?: string } & VehicleCharging)[] = useMemo(() => {
		const activeBookingsFiltered = bookings.filter(booking => booking.status === "active");
		return activeBookingsFiltered.map(booking => ({ ...booking, remaining_time: calculateRemainingTime(booking) }));
	}, [bookings, calculateRemainingTime]);

	return (
		<>
			<Header
				right={
					<Button
						onClick={() => router.push("notifications")}
						variant="secondary"
						size="icon"
						className="rounded-full text-foreground"
					>
						<Icons.BellIcon />
					</Button>
				}
				headerBackground="bg-background shadow-sm"
			>
				<Image src="/assets/images/logo-name.svg" alt="pin-logo" width={100} height={100} className="w-20 h-auto" />
			</Header>

			<Layout className="py-24">
				{activeBookings.length ? (
					<FlatList
						data={activeBookings}
						keyExtractor={booking => booking.id}
						renderItem={activeBooking => (
							<div
								className="mb-6 p-4 bg-foreground text-background rounded-xl cursor-pointer relative overflow-hidden"
								onClick={() => router.push(`/charge?id=${activeBooking.id}`)}
							>
								<div className="flex justify-between items-start mb-2">
									<div>
										<p className="text-slate-300 text-sm">Currently Charging</p>

										{/* Vehicle Details */}
										{typeof activeBooking.vehicle !== "number" && (
											<p>
												{activeBooking.vehicle?.brand} {activeBooking.vehicle?.model} •{" "}
												{activeBooking.vehicle?.details?.vehicle_number}
											</p>
										)}
										<p className="font-bold">
											Device{" "}
											{typeof activeBooking.charging_slot !== "number"
												? activeBooking.charging_slot.name
												: "N/A"}{" "}
											• #
											{typeof activeBooking.charging_slot !== "number"
												? activeBooking.charging_slot.id
												: "N/A"}
											{typeof activeBooking.charging_slot !== "number" && activeBooking.charging_slot.id}
										</p>
									</div>
								</div>

								<p className="text-slate-400 text-sm mt-2">
									Remaining Time: <span className="text-primary">{activeBooking.remaining_time}</span>
								</p>
							</div>
						)}
					/>
				) : null}

				<Tabs value={activeTab} onValueChange={value => router.replace(`/bookings?tab=${value}`)} className="w-full">
					<TabsList className="grid w-full grid-cols-2 mb-4">
						<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
						<TabsTrigger value="past">Past</TabsTrigger>
					</TabsList>

					{isLoading ? (
						<div className="mt-56 flex items-center justify-center">
							<Icons.LoadingIcon2 className="w-8 h-8 text-primary" />
						</div>
					) : (
						<>
							<TabsContent value="upcoming">
								<FlatList
									data={bookings}
									keyExtractor={booking => booking.id}
									renderItem={booking => (
										<BookingCard booking={booking} setBookings={setBookings} walletBalance={walletBalance} />
									)}
									emptyListComponent={() => emptyListComponent(router, true)}
								/>
							</TabsContent>
							<TabsContent value="past">
								<FlatList
									data={bookings}
									keyExtractor={booking => booking.id}
									renderItem={booking => (
										<BookingCard
											booking={booking}
											setBookings={setBookings}
											walletBalance={walletBalance}
											isPastBooking
										/>
									)}
									emptyListComponent={() => emptyListComponent(router, false)}
								/>
							</TabsContent>
						</>
					)}
				</Tabs>
			</Layout>
		</>
	);
};

export default FutureBookings;

const emptyListComponent = (router: AppRouterInstance, isUpcoming = false) => (
	<div className="mt-32">
		<div className="flex items-center justify-center mb-4">
			<Icons.CalendarIcon className="w-12 h-auto text-muted-foreground" />
		</div>
		<p className="text-lg text-center text-muted-foreground">No {isUpcoming ? "upcoming" : "past"} bookings.</p>

		{isUpcoming ? (
			<div className="mt-4 flex items-center justify-center">
				<Button onClick={() => router.replace("/")}>
					<Icons.ChargingStationIcon className="w-4 h-4 mr-2" />
					Book a Charging Device
				</Button>
			</div>
		) : null}
	</div>
);
