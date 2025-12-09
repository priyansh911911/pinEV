import { FC, useState } from "react";
import Image from "next/image";
import Stores from "@/lib/stores";
import { formatDate, formatDuration } from "date-fns";
import { Icons } from "@/components/icons";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { sendToNative, formatCurrency, calculatedDuration } from "@/lib/utils";
import CustomAlertDialog from "../alert-dialog";
import { toast } from "sonner";
import { updateVehicleCharging } from "@/actions/vehicles-chargings";
import { saveTransaction } from "@/actions/transactions";
import QRCodeScannerModal from "../qrcode-scanner-modal";

interface BookingCardProps {
	booking: VehicleCharging;
	isPastBooking?: boolean;
	setBookings: React.Dispatch<React.SetStateAction<VehicleCharging[]>>;
	walletBalance: number;
}

const BookingCard: FC<BookingCardProps> = ({ booking, isPastBooking = false, setBookings, walletBalance }) => {
	const router = useRouter();
	const [openCancelDialog, setOpenCancelDialog] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [scannerOpen, setScannerOpen] = useState(false);

	const { isNative } = Stores();

	function handleNavigate(latitude: number, longitude: number) {
		const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

		if (isNative) {
			sendToNative({ type: "url", url: url });
		} else {
			window.open(url, "_blank");
		}
	}

	if (typeof booking.station === "number" || typeof booking.vehicle === "number" || typeof booking.charging_slot === "number") {
		return null;
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case "scheduled":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "active":
				return "bg-green-100 text-green-800 border-green-200";
			case "completed":
				return "bg-gray-100 text-gray-800 border-gray-200";
			case "cancelled":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getDuration = (booking: VehicleCharging) => {
		if (booking.status === "completed" && booking.started_at && booking.stopped_at) {
			const start = new Date(booking.started_at);
			const end = new Date(booking.stopped_at);

			const duration = calculatedDuration(start, end, { short: true });

			return duration;
		}

		return formatDuration({ minutes: booking.duration_in_minute })
			.replace(/\byears?\b/g, "yr")
			.replace(/\bmonths?\b/g, "mo")
			.replace(/\bdays?\b/g, "d")
			.replace(/\bhours?\b/g, "hr")
			.replace(/\bminutes?\b/g, "min")
			.replace(/\bseconds?\b/g, "sec");
	};

	const handleCancelBooking = async () => {
		if (isCancelling) return;

		setIsCancelling(true);

		try {
			const res = await updateVehicleCharging({ id: booking.id, body: { status: "cancelled" } });
			if (res.err) {
				console.log("Error cancelling booking:", res.result);
				toast.error("Failed to cancel booking");
				return;
			}

			setBookings(prev => prev.map(b => (b.id === booking.id ? { ...b, status: "cancelled" } : b)));

			// const updatedWalletBalance = Number(walletBalance || 0) + Number(booking.amount_paid || 0);

			// await saveTransaction({
			// 	body: {
			// 		user: (booking.user as User).id || booking.user,
			// 		amount: booking.amount_paid,
			// 		total_balance: updatedWalletBalance,
			// 		date: formatDate(new Date(), "yyyy-MM-dd HH:mm:ss"),
			// 		type: "credit",
			// 		description: `Booking cancellation refund for booking #${booking.id}`,
			// 		station: (booking.station as AdminStation).id,
			// 	},
			// });

			toast.success("Booking cancelled successfully");
		} catch (error) {
			toast.error("Failed to cancel booking");
		} finally {
			setIsCancelling(false);
			setOpenCancelDialog(false);
		}
	};

	const handleQRScan = (data: string) => {
		if (!data) return;

		if (!data.includes("::")) {
			toast.error("Invalid QR code data");
			return;
		}

		const [stationId, slotId] = data.split("::");

		if (!stationId || !slotId) {
			toast.error("Invalid QR code data");
			return;
		}

		const stationIdFromBooking = (booking.station as AdminStation).id.toString();
		const slotIdFromBooking = (booking.charging_slot as ChargingSlot).id.toString();

		if (stationId !== stationIdFromBooking || slotId !== slotIdFromBooking) {
			toast.error("Wrong QR code scanned for this booking");

			return;
		}

		router.push(`/booking/scanned?bookingId=${booking.id}`);
	};

	return (
		<>
			<div className="mb-6 bg-background rounded-2xl shadow-md border border-gray-100 overflow-hidden">
				<div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
					<div className="flex justify-between items-start mb-3">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<Icons.ChargingStationIcon className="w-5 h-5 text-primary" />
								<h3 className="font-bold text-lg text-gray-900">{booking.station.name}</h3>
							</div>
							<p className="text-sm text-gray-600 flex items-center gap-1">
								<Icons.MapPinIcon className="w-3 h-3" />
								{booking.station.address}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge className={getStatusColor(booking.status)} variant="outline">
								{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
							</Badge>
							<Button
								variant="outline"
								size="icon"
								className="rounded-lg h-8 w-8"
								onClick={() => {
									if (typeof booking.station === "number") return;
									handleNavigate(booking.station.latitude, booking.station.longitude);
								}}
							>
								<Icons.NavigationIcon className="w-3 h-3" />
							</Button>
						</div>
					</div>
				</div>

				<div className="p-4 space-y-4">
					<div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
						<Image
							src={
								booking.vehicle.image
									? process.env.NEXT_PUBLIC_IMAGE_URL! + booking.vehicle.image
									: "/assets/images/car.jpg"
							}
							alt="vehicle"
							width={60}
							height={60}
							className="w-16 h-12 object-contain rounded-lg"
						/>
						<div className="flex-1">
							<h4 className="font-semibold text-gray-900">
								{booking.vehicle.brand} {booking.vehicle.model}
							</h4>
							<div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
								<span className="flex items-center gap-1">
									<Icons.CarIcon className="w-3 h-3" />
									{(booking.vehicle as any).details?.vehicle_number || "N/A"}
								</span>
								<span className="flex items-center gap-1">
									<Icons.BatteryIcon className="w-3 h-3" />
									{(booking.vehicle as any).details.battery_capacity || "N/A"} kW
								</span>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-3">
							<div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Icons.CalendarIcon className="w-4 h-4 text-blue-600" />
								</div>
								<div>
									<p className="text-xs text-gray-500 uppercase tracking-wide">Date & Time</p>
									<p className="font-semibold text-sm text-gray-900">
										{formatDate(
											booking.status === "completed" ? booking.started_at || new Date() : booking.datetime,
											"dd MMM"
										)}
									</p>
									<p className="text-xs text-gray-600">
										{formatDate(
											booking.status === "completed" ? booking.started_at || new Date() : booking.datetime,
											"hh:mm a"
										)}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
								<div className="p-2 bg-green-100 rounded-lg">
									<Icons.BoltIcon className="w-4 h-4 text-green-600" />
								</div>
								<div>
									<p className="text-xs text-gray-500 uppercase tracking-wide">Charging Device</p>
									<p className="font-semibold text-sm text-gray-900">{booking.charging_slot.name}</p>
									<p className="text-xs text-gray-600">
										{booking.charging_slot.power} kW • {booking.charging_slot.connector_type}
									</p>
								</div>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
								<div className="p-2 bg-orange-100 rounded-lg">
									<Icons.ClockIcon className="w-4 h-4 text-orange-600" />
								</div>
								<div>
									<p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
									<p className="font-semibold text-sm text-gray-900">{getDuration(booking)}</p>
									<p className="text-xs text-gray-600">₹1.00/min</p>
								</div>
							</div>

							<div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
								<div className="p-2 bg-purple-100 rounded-lg">
									<Icons.PowerIcon className="w-4 h-4 text-purple-600" />
								</div>
								<div>
									<p className="text-xs text-gray-500 uppercase tracking-wide">Power</p>
									<p className="font-semibold text-sm text-gray-900">{booking.charging_slot.power} kW</p>
									<p className="text-xs text-gray-600">Device Power</p>
								</div>
							</div>
						</div>
					</div>

					{/* {(booking.vehicle as any).details.range_per_charge && (
					<div className="p-3 bg-gray-50 rounded-xl">
						<p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Vehicle Specifications</p>
						<div className="grid grid-cols-3 gap-4 text-center">
							<div>
								<Icons.BatteryIcon className="w-4 h-4 mx-auto text-gray-600 mb-1" />
								<p className="text-xs text-gray-500">Capacity</p>
								<p className="text-sm font-semibold">{(booking.vehicle as any).details.battery_capacity} kWh</p>
							</div>
							<div>
								<Icons.RouteIcon className="w-4 h-4 mx-auto text-gray-600 mb-1" />
								<p className="text-xs text-gray-500">Range</p>
								<p className="text-sm font-semibold">{(booking.vehicle as any).details.range_per_charge} km</p>
							</div>
							<div>
								<Icons.CalendarIcon className="w-4 h-4 mx-auto text-gray-600 mb-1" />
								<p className="text-xs text-gray-500">Year</p>
								<p className="text-sm font-semibold">{(booking.vehicle as any).details.year_of_manufacture}</p>
							</div>
						</div>
					</div>
				)} */}

					<div className="flex items-center justify-between gap-2 mt-4">
						<Button
							variant="outline"
							className="w-full"
							onClick={() => router.push(`/charge?id=${booking.id}`)}
							rightIcon={<Icons.ArrowLeftIcon className="w-4 h-4 rotate-180" />}
						>
							View Details
						</Button>
						{isPastBooking && booking.status === "completed" && (
							<Button
								variant="outline"
								className="w-full"
								onClick={() => router.push(`/charge/invoice?id=${booking.id}`)}
								rightIcon={<Icons.FileTextIcon className="w-4 h-4" />}
							>
								View Invoice
							</Button>
						)}
					</div>
				</div>

				{!isPastBooking && booking.status === "scheduled" && (
					<>
						<Separator />
						<div className="flex">
							<Button
								variant="ghost"
								className="flex-1 rounded-none h-14 hover:bg-primary/10 hover:text-primary"
								onClick={() => {
									//TODO: Handle QR scan
									// router.push(`/booking/scanned?bookingId=${booking.id}`);
									setScannerOpen(true);
								}}
								leftIcon={<Icons.QrCodeIcon className="w-4 h-4" />}
							>
								Scan QR
							</Button>
							<Separator orientation="vertical" className="h-14" />
							<Button
								variant="ghost"
								className="flex-1 rounded-none h-14 text-destructive hover:bg-destructive/10 hover:text-destructive"
								leftIcon={<Icons.BanIcon className="w-4 h-4" />}
								onClick={() => setOpenCancelDialog(true)}
							>
								Cancel
							</Button>

							<CustomAlertDialog
								title="Cancel your booking"
								description="Are you sure you want to cancel this charging session? This action cannot be undone and any applicable cancellation fees may apply."
								open={openCancelDialog}
								setOpen={setOpenCancelDialog}
								onCancel={() => setOpenCancelDialog(false)}
								onConfirm={handleCancelBooking}
								confirmText="Yes, Cancel Booking"
								cancelText="No, Keep Booking"
							/>
						</div>
					</>
				)}
			</div>

			{scannerOpen && (
				<QRCodeScannerModal open={scannerOpen} onScanResult={handleQRScan} onClose={() => setScannerOpen(false)} />
			)}
		</>
	);
};

export default BookingCard;
