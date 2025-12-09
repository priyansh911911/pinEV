"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FlatList from "@/components/flat-list";
import { format } from "date-fns";
import * as BookingActions from "@/actions/bookings";
import Stores from "@/lib/stores";
import { toast } from "sonner";

// Booking type definition
type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Booking {
	id: number;
	user: number;
	station: number;
	station_name: string;
	start_time: Date;
	end_time: Date;
	status: BookingStatus;
	amount: number;
	created_at: Date;
	updated_at: Date;
}

const getEndTime = (startTime: Date, duration: number): Date => {
	const durationInMs = duration * 60 * 1000;
	return new Date(startTime.getTime() + durationInMs);
};

const BookingsAdminPage = () => {
	const router = useRouter();
	const { user } = Stores();
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "all">("all");
	const [isLoading, setIsLoading] = useState(false);

	const filteredBookings = bookings.filter(booking => {
		const matchesSearch =
			booking.station_name.toLowerCase().includes(searchQuery.toLowerCase()) || booking.id.toString().includes(searchQuery);
		const matchesStatus = selectedStatus === "all" || booking.status === selectedStatus;
		return matchesSearch && matchesStatus;
	});

	const handleGetBookings = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await BookingActions.getBookings();

			if (res.err) {
				console.error("Error fetching bookings:", res.result);
				return;
			}

			// Transform the raw booking data to match our Booking interface
			const formattedBookings: Booking[] = res.result.map((booking: any) => ({
				id: booking.id,
				user: booking.user,
				station: booking.station,
				station_name: booking.station?.name || `Station #${booking.station}`,
				start_time: new Date(booking.datetime),
				end_time: getEndTime(new Date(booking.datetime), booking.duration),
				status: booking.status,
				amount: booking.amount,
				created_at: new Date(booking.created_at),
				updated_at: new Date(booking.updated_at),
			}));

			setBookings(formattedBookings);
		} catch (error) {
			console.error("Failed to fetch bookings:", error);
			toast.error("Failed to fetch bookings");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const updateBookingStatus = async (id: number, status: BookingStatus) => {
		try {
			// Call the API to update booking status
			const res = await BookingActions.updateBooking({ id, body: { status } });
			if (res.err) {
				toast.error("Failed to update booking status");
				return;
			}

			// Update the local state with the new status
			setBookings(prev => prev.map(booking => (booking.id === id ? { ...booking, status } : booking)));

			toast.success(`Booking #${id} status updated to ${status}`);
		} catch (error) {
			console.error("Failed to update booking status:", error);
			toast.error("Failed to update booking status");
		}
	};

	useEffect(() => {
		handleGetBookings();
	}, [handleGetBookings]);

	return (
		<>
			<Header headerBackground="bg-white" back>
				<h2 className="text-lg font-bold">Manage Bookings</h2>
			</Header>
			<Layout>
				<div className="mt-[90px] pb-20">
					<div className="mb-5">
						<Input
							type="text"
							placeholder="Search by station name or booking ID..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="mb-4"
						/>

						<Tabs defaultValue="all" onValueChange={value => setSelectedStatus(value as BookingStatus | "all")}>
							<TabsList className="w-full justify-start overflow-x-auto mb-4">
								<TabsTrigger value="all">All</TabsTrigger>
								<TabsTrigger value="pending">Pending</TabsTrigger>
								<TabsTrigger value="confirmed">Confirmed</TabsTrigger>
								<TabsTrigger value="completed">Completed</TabsTrigger>
								<TabsTrigger value="cancelled">Cancelled</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* Bookings Summary Card */}
					<Card className="mb-6">
						<CardContent className="p-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Total Bookings</span>
									<span className="text-lg font-bold">{isLoading ? "..." : bookings.length}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Active Bookings</span>
									<span className="text-lg font-bold">
										{isLoading ? "..." : bookings.filter(b => b.status === "confirmed").length}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{isLoading ? (
						<div className="flex items-center justify-center min-h-[200px]">
							<Icons.LoadingIcon className="w-6 h-6 animate-spin" />
						</div>
					) : filteredBookings.length > 0 ? (
						<FlatList
							data={filteredBookings}
							keyExtractor={booking => booking.id}
							renderItem={booking => (
								<Card key={booking.id} className="mb-4">
									<CardContent className="p-4">
										<div className="flex justify-between items-start">
											<div>
												<span className="text-xs text-muted-foreground">Booking #{booking.id}</span>
												<h3 className="font-semibold">{booking.station_name}</h3>
												<div className="flex items-center mt-1">
													<Icons.UserIcon className="w-3 h-3 mr-1 text-muted-foreground" />
													<span className="text-xs text-muted-foreground">User #{booking.user}</span>
												</div>
											</div>
											<Badge
												variant={
													booking.status === "confirmed"
														? "default"
														: booking.status === "completed"
														? "outline"
														: booking.status === "cancelled"
														? "destructive"
														: "secondary"
												}
											>
												{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
											</Badge>
										</div>

										<div className="mt-3 grid grid-cols-2 gap-2">
											<div className="flex flex-col">
												<span className="text-xs text-muted-foreground">Start Time</span>
												<span className="text-sm">
													{format(booking.start_time, "MMM d, yyyy h:mm a")}
												</span>
											</div>
											<div className="flex flex-col">
												<span className="text-xs text-muted-foreground">End Time</span>
												<span className="text-sm">{format(booking.end_time, "MMM d, yyyy h:mm a")}</span>
											</div>
										</div>

										<div className="flex justify-between items-center mt-3">
											<div className="flex flex-col">
												<span className="text-xs text-muted-foreground">Amount</span>
												<span className="text-base font-semibold">₹{booking.amount}</span>
											</div>
											<div className="flex flex-col text-right">
												<span className="text-xs text-muted-foreground">Created</span>
												<span className="text-xs">{format(booking.created_at, "MMM d, yyyy")}</span>
											</div>
										</div>

										<div className="mt-4 grid grid-cols-2 gap-3">
											<Button
												variant="outline"
												size="sm"
												onClick={() => router.push(`/admin/bookings/view?id=${booking.id}`)}
											>
												<Icons.EyeIcon className="w-4 h-4 mr-1" />
												View Details
											</Button>

											{booking.status === "pending" && (
												<Button
													variant="default"
													size="sm"
													onClick={() => updateBookingStatus(booking.id, "confirmed")}
												>
													<Icons.CheckIcon className="w-4 h-4 mr-1" />
													Confirm
												</Button>
											)}

											{booking.status === "confirmed" && (
												<Button
													variant="default"
													size="sm"
													onClick={() => updateBookingStatus(booking.id, "completed")}
												>
													<Icons.CheckIcon className="w-4 h-4 mr-1" />
													Complete
												</Button>
											)}

											{(booking.status === "pending" || booking.status === "confirmed") && (
												<Button
													variant="destructive"
													size="sm"
													className={booking.status === "confirmed" ? "col-span-2" : ""}
													onClick={() => updateBookingStatus(booking.id, "cancelled")}
												>
													<Icons.CloseIcon className="w-4 h-4 mr-1" />
													Cancel
												</Button>
											)}
										</div>
									</CardContent>
								</Card>
							)}
							// noResultsText={
							// 	<div className="flex flex-col items-center justify-center py-10">
							// 		<Icons.SearchXIcon className="w-10 h-10 text-muted-foreground mb-3" />
							// 		<h3 className="text-lg font-medium mb-1">No Bookings Found</h3>
							// 		<p className="text-sm text-center text-muted-foreground max-w-xs">
							// 			We could not find any bookings matching your search criteria. Try adjusting your search.
							// 		</p>
							// 	</div>
							// }
						/>
					) : (
						<div className="flex flex-col items-center justify-center min-h-[200px]">
							<Icons.CalendarIcon className="w-10 h-10 text-muted-foreground mb-3" />
							<h3 className="text-lg font-medium mb-1">No Bookings Available</h3>
							<p className="text-sm text-center text-muted-foreground max-w-xs">
								There are no bookings in the system yet.
							</p>
						</div>
					)}

					<Button
						variant="outline"
						onClick={() => handleGetBookings()}
						className="fixed bottom-5 right-5 rounded-full shadow-lg"
					>
						<Icons.RefreshCcwIcon className="w-4 h-4 mr-2" />
						Refresh
					</Button>
				</div>
			</Layout>
		</>
	);
};

export default BookingsAdminPage;
