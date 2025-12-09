"use client";

import { getVehiclesChargings } from "@/actions/vehicles-chargings";
import Header from "@/components/custom/header";
import Loader from "@/components/custom/loader";
import Transition from "@/components/custom/transition";
import { Icons } from "@/components/icons";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, toUrlSafeBase64 } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const BookingSuccessPage = () => {
	return (
		<Suspense fallback={<Loader />}>
			<Component />
		</Suspense>
	);
};

export default BookingSuccessPage;

const Component = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const bookingId = searchParams.get("bookingId");

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [bookingDetails, setBookingDetails] = useState<VehicleCharging | null>(null);

	const handleGetBooking = useCallback(async () => {
		if (!bookingId) {
			router.push("/home");
			return;
		}

		setIsLoading(true);

		try {
			const res = await getVehiclesChargings({
				search: `id:${bookingId}`,
				joins: "charging_slot:stations_slots,station:stations",
			});

			if (res.err || res.count === 0) {
				console.error("Error fetching booking details:", res.err);
				return;
			}

			setBookingDetails(res.result[0]);
		} catch (error) {
			console.error("Error fetching booking details:", error);
			router.push("/home");
		} finally {
			setIsLoading(false);
		}
	}, [bookingId, router]);

	useEffect(() => {
		handleGetBooking();
	}, [handleGetBooking]);

	if (isLoading) {
		return (
			<Transition>
				<Loader />
			</Transition>
		);
	}

	return (
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
			/>

			<Layout fullWidth>
				<div className="py-5 bg-gradient-to-br from-primary/80 to-primary rounded-b-3xl">
					<div className="default-page-width mt-8 flex flex-col items-center gap-8 text-background">
						<Image src="/assets/icons/success.svg" alt="success" width={100} height={100} />

						<h1 className="text-2xl font-bold">Booking Successfull</h1>
						<p className="text-lg font-semibold">Booking ID: #{bookingId}</p>
					</div>

					<div className="h-8"></div>
				</div>

				<div className="default-page-width mt-8 space-y-8">
					<div className="flex items-start gap-4">
						<Icons.ChargingStationIcon className="text-neutral-600 w-7 h-auto" />
						<div className="space-y-2">
							<p className="text-lg font-semibold text-neutral-600">Station</p>
							<h1 className="text-xl font-bold">
								{typeof bookingDetails?.station !== "number" && bookingDetails?.station.name}
							</h1>
						</div>
					</div>

					<div className="flex items-start gap-4">
						<Icons.CalendarIcon className="text-neutral-600" />
						<div className="space-y-2">
							<p className="text-lg font-semibold text-neutral-600">Date and Time</p>
							<h1 className="text-xl font-bold">
								{formatDate("DD MMM, YYYY | hh:mm A", bookingDetails?.datetime || "today")}
							</h1>
						</div>
					</div>

					<div className="flex items-start gap-4">
						<Image src="/assets/icons/connector-type3.svg" alt="connector" width={24} height={24} />
						<div className="space-y-2">
							<p className="text-lg font-semibold text-neutral-600">Charger Details</p>
							<h1 className="text-xl font-bold">
								{/* Slot 1 - <span className="text-primary">#123456</span> */}
								{typeof bookingDetails?.charging_slot !== "number" &&
									`${bookingDetails?.charging_slot.name} - #${toUrlSafeBase64(
										bookingDetails?.charging_slot.id || ""
									)}`}
							</h1>
						</div>
					</div>

					{/* <div className="flex items-start gap-4">
						<Icons.IndianRupeeIcon className="text-neutral-600" />
						<div className="space-y-2">
							<p className="text-lg font-semibold text-neutral-600">Amount</p>
							<h1 className="text-xl font-bold">
								{formatCurrency(bookingDetails?.amount_paid || 0)}{" "}
								<span className="text-neutral-600 font-semibold">(Incl. tax)</span>
							</h1>
						</div>
					</div> */}

					<Separator />

					<p className="text-sm text-neutral-600">
						Your booking is confirmed. Please arrive at the station on time to avoid any cancellation charges. You can
						view your bookings in the &quot;Bookings&quot; section of the app.
					</p>

					<div className="flex items-center justify-center">
						<Button
							leftIcon={<Icons.CheckIcon />}
							className="w-48 rounded-full"
							size="xl"
							onClick={() => router.push("/bookings")}
						>
							Done
						</Button>
					</div>

					<div className="h-8"></div>
				</div>
			</Layout>
		</Transition>
	);
};
