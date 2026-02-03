"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout";
import { Icon, Icons } from "@/components/icons";
import Loader from "@/components/custom/loader";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { getStations } from "@/actions/stations";
import EditStationModal from "@/components/custom/manage-station/edit-station-modal";
import { toast } from "sonner";
import { getStationsSlots, updateStationsSlots } from "@/actions/stations-slots";
import { API_URL, getSlotStatus, getUnusedConnectorId, toggleCharging } from "@/functions/charging";
import { inBetweenRandomGenerator, toUrlSafeBase64 } from "@/lib/utils";
import { generateQRCodePDF, downloadQRCodeImage } from "@/lib/generate-qr";
import Stores from "@/lib/stores";

const STATION_DEVICE_BASE_URL = "wss://ocpp.pinev.net";

const statusConfig: Record<StationStatus, { color: string; icon: keyof typeof Icons }> = {
	pending: { color: "bg-yellow-200 text-yellow-800 border-yellow-200", icon: "CalendarIcon" },
	approved: { color: "bg-green-200 text-green-800 border-green-200", icon: "CheckIcon" },
	rejected: { color: "bg-slate-200 text-slate-800 border-slate-200", icon: "CloseIcon" },
	blocked: { color: "bg-red-200 text-red-800 border-red-200", icon: "BanIcon" },
	inactive: { color: "bg-gray-200 text-gray-800 border-gray-200", icon: "PauseIcon" },
};

const slotsStatusConfig: Record<"active" | "inactive", { color: string; icon: keyof typeof Icons }> = {
	active: { color: "bg-green-200 text-green-800 border-green-200", icon: "CheckIcon" },
	inactive: { color: "bg-gray-200 text-gray-800 border-gray-200", icon: "PauseIcon" },
};

const StationDetailsPage = () => {
	return (
		<Suspense fallback={<Loader />}>
			<Component />
		</Suspense>
	);
};

export default StationDetailsPage;

const Component = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const id = searchParams.get("id");

	const [isLoading, setIsLoading] = useState(true);
	const [stationsSlots, setStationsSlots] = useState<StationSlot[]>([]);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const handleGetStation = useCallback(async () => {
		if (!id) {
			return;
		}

		setIsLoading(true);
		try {
			const res = await getStationsSlots({ search: `station.id:${id}` });

			if (res.err) {
				return notFound();
			}

			setStationsSlots(res.result);
		} catch (error) {
			toast.error("Failed to fetch station");
		} finally {
			setIsLoading(false);
		}
	}, [id]);

	useEffect(() => {
		handleGetStation();
	}, [handleGetStation]);

	const station = useMemo(() => (stationsSlots.length ? stationsSlots[0].station : null), [stationsSlots]);

	if (isLoading) {
		return <Loader />;
	}

	if (stationsSlots.length === 0) {
		return (
			<>
				<Header
					back
					right={
						<div className="flex items-center gap-3">
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground hover:text-foreground"
								onClick={handleGetStation}
							>
								<Icons.RefreshCcwIcon className="h-5 w-5" />
							</Button>
						</div>
					}
					headerBackground="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10"
				>
					<h1 className="text-xl font-semibold">Station Details</h1>
				</Header>

				<Layout className="pb-10">
					<div className="h-16" />
					<Card className="max-w-lg mx-auto mt-20">
						<CardHeader>
							<CardTitle>No Devices Found</CardTitle>
							<CardDescription>
								There are no devices for this station. Please create a device first.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								variant="default"
								onClick={() => router.push(`/admin/stations/manage?id=${id}`)}
								className="w-full"
							>
								Create Device
							</Button>
						</CardContent>
					</Card>
				</Layout>
			</>
		);
	}

	if (!station) {
		return notFound();
	}

	const StatusIcon = Icons[statusConfig[station.status].icon];

	return (
		<>
			<Header
				// left={
				// 	<Button variant="ghost" size="icon" className="hover:bg-background" onClick={() => router.back()}>
				// 		<Icons.ArrowLeftIcon className="h-5 w-5" />
				// 	</Button>
				// }
				back
				right={
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-foreground"
							onClick={handleGetStation}
						>
							<Icons.RefreshCcwIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-foreground"
							onClick={() => setIsEditModalOpen(true)}
						>
							<Icons.EditIcon className="h-5 w-5" />
						</Button>
					</div>
				}
				headerBackground="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10"
			>
				<h1 className="text-xl font-semibold">Station Details</h1>
			</Header>

			<Layout className="min-h-screen pb-10">
				<div className="h-16" />

				<div className="space-y-8">
					<Card>
						<CardHeader className="pb-4">
							<div className="flex items-start justify-between">
								<div className="space-y-1.5 flex-1 mr-4">
									<div
										className="flex items-center gap-2 group cursor-pointer"
										onClick={() => setIsEditModalOpen(true)}
									>
										<CardTitle className="text-2xl">{station.name}</CardTitle>
										<Icons.EditIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
									<CardDescription className="flex items-center gap-2">
										<span>ID: {station.code}</span>
										<span className="text-muted-foreground/30">•</span>
										<span>Last updated 2 hours ago</span>
									</CardDescription>
								</div>
								<Badge variant="outline" className={`capitalize gap-1.5 ${statusConfig[station.status].color}`}>
									<StatusIcon className="h-4 w-4" />
									{station.status}
								</Badge>
							</div>
						</CardHeader>

						<CardContent className="grid gap-6">
							<div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/5 relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
								<Icons.MapPinIcon className="h-5 w-5 text-primary shrink-0" />
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<p className="font-medium text-sm">Location</p>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
										>
											<Icons.EditIcon className="h-3 w-3" />
										</Button>
									</div>
									<p className="text-sm text-muted-foreground mt-1">{station.address}</p>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/5 relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
									<Icons.PhoneIcon className="h-5 w-5 text-primary shrink-0" />
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<p className="font-medium text-sm">Phone</p>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<Icons.EditIcon className="h-3 w-3" />
											</Button>
										</div>
										<p className="text-sm text-muted-foreground mt-1">{station.details.phone}</p>
									</div>
								</div>

								<div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/5 relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
									<Icons.MailIcon className="h-5 w-5 text-primary shrink-0" />
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<p className="font-medium text-sm">Email</p>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<Icons.EditIcon className="h-3 w-3" />
											</Button>
										</div>
										<p className="text-sm text-muted-foreground mt-1">{station.details.email}</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Charging Devices</CardTitle>

								<Button
									variant="outline"
									size="sm"
									onClick={() => router.push(`/admin/stations/manage?id=${station.id}`)}
									className="gap-2"
								>
									<Icons.SettingsIcon className="h-4 w-4" />
									Manage
								</Button>
							</div>
							<CardDescription>Available charging devices at this station</CardDescription>
						</CardHeader>
						<CardContent>
							{stationsSlots.length > 0 ? (
								<div className="grid grid-cols-1 gap-4">
									{stationsSlots.map(slot => (
										<SlotCard key={slot.id} slot={slot} />
									))}
								</div>
							) : (
								<p className="text-muted-foreground">No charging devices available for this station.</p>
							)}
						</CardContent>
					</Card>
				</div>
			</Layout>

			<EditStationModal
				open={isEditModalOpen}
				onOpenChange={setIsEditModalOpen}
				station={station}
				onSuccess={handleGetStation}
			/>
		</>
	);
};

type CopyState = "idle" | "copied" | "error";
function getCopyIcon(copyState: CopyState): Icon {
	switch (copyState) {
		case "idle":
			return "CopyIcon";
		case "copied":
			return "CopyCheckIcon";
		case "error":
			return "CopyXIcon";
	}
}

function getCopyText(copyState: CopyState): string {
	switch (copyState) {
		case "idle":
			return "Copy Link";
		case "copied":
			return "Copied!";
		case "error":
			return "Error";
	}
}

const SlotCard = ({ slot }: { slot: StationSlot }) => {
	const [copyState, setCopyState] = useState<CopyState>("idle");
	const [togglingCharge, setTogglingCharge] = useState(false);
	const [downloadingQR, setDownloadingQR] = useState(false);

	const SlotIcon = Icons[slotsStatusConfig[slot.status].icon];
	const CopyIcon = Icons[getCopyIcon(copyState)];

	const { user, isNative } = Stores();

	const handleCopyLink = async (slotId: string) => {
		navigator.clipboard
			.writeText(`${STATION_DEVICE_BASE_URL}/${toUrlSafeBase64(slotId)}`)
			.then(() => {
				setCopyState("copied");
				toast.success("Link copied to clipboard");
				setTimeout(() => setCopyState("idle"), 2000);
			})
			.catch(() => {
				setCopyState("error");
				setTimeout(() => setCopyState("idle"), 2000);
			});
	};

	const handleDownloadQRCodePDF = async () => {
		setDownloadingQR(true);
		try {
			await generateQRCodePDF(slot.station.id, slot.id, slot.station.name, slot.name, isNative);
		} catch (error) {
			console.error("Error downloading QR Code PDF:", error);
			toast.error("Failed to download QR Code PDF");
		} finally {
			setDownloadingQR(false);
		}
	};

	const handleDownloadQRCodeImage = async () => {
		setDownloadingQR(true);
		try {
			await downloadQRCodeImage(slot.station.id, slot.id, slot.station.name, slot.name, isNative);
		} catch (error) {
			console.error("Error downloading QR Code image:", error);
			toast.error("Failed to download QR Code image");
		} finally {
			setDownloadingQR(false);
		}
	};

	const handleToggleCharging = async (slotId: string, action: "start" | "stop") => {
		if (!user) {
			toast.error("You must be logged in to perform this action");
			return;
		}

		setTogglingCharge(true);

		try {
			const slotStatusRes = await getSlotStatus(slotId);

			if (slotStatusRes.err || slotStatusRes.count === 0) {
				console.error("Error fetching slot status:", slotStatusRes.result);
				toast.error("Failed to fetch charging device status");
				return;
			}
			const slot: StationSlot = slotStatusRes.result[0];

			if (action === "start") {
				const isBusy = (slot.active_connectors || []).length === slot.no_of_connector;

				if (isBusy) {
					toast.error("Charging device is currently busy. Please try again later.");
					return;
				}
			}

			const connectorId = action === "start" ? getUnusedConnectorId(slot) : slot.active_connectors?.[0];
			if (!connectorId) {
				toast.error("No available connector found for this charging device.");
				return;
			}

			// TODO: Generate a unique transaction ID for the charging action
			const transactionId = inBetweenRandomGenerator(1_00_000, 9_99_999);

			const res = await toggleCharging({
				deviceId: toUrlSafeBase64(slotId),
				transactionId,
				connectorId: String(connectorId),
				idTag: String(user.id),
				type: action,
			});

			if (res.err) {
				console.error(`Error ${action} charge:`, res.result);
				toast.error(`Failed to ${action} charging session`);
				return;
			}

			const { status } = res.result;

			if (status !== "Accepted") {
				toast.error(`Session not ${action}ed`);
				return;
			}

			console.log(`Charging ${action} response:`, res);

			let slotBody: Partial<StationSlot> = {};
			if (action === "start") {
				slotBody = {
					active_connectors: [...(slot.active_connectors || []), connectorId],
				};
			} else {
				slotBody = {
					active_connectors: (slot.active_connectors || []).filter(id => id !== connectorId),
				};
			}

			const updateRes = await updateStationsSlots({
				id: slot.id,
				body: slotBody,
			});

			console.log(`Update slot after ${action} response:`, updateRes);
		} catch (error) {
			console.log("Error toggling charging:", error);

			toast.error(`Failed to ${action} charging`);
		} finally {
			setTogglingCharge(false);
		}
	};

	return (
		<Card key={slot.id} className="hover:shadow-md transition-shadow duration-200">
			<CardContent className="p-4">
				<div className="flex flex-col space-y-2">
					<div className="flex items-center justify-between gap-2">
						<h3 className="text-lg font-semibold">{slot.name}</h3>

						<Badge variant="outline" className={`capitalize ${slotsStatusConfig[slot.status].color}`}>
							<SlotIcon className="h-4 w-4" />
							{slot.status}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">Power: {slot.power} kW</p>
					<p className="text-sm text-muted-foreground">Type: {slot.connector_type}</p>
					{slot.schedules.map(schedule => (
						<p key={schedule.id} className="text-sm text-muted-foreground">
							<span>
								{schedule.days.length > 0
									? schedule.days.length === 7
										? "Every day"
										: schedule.days.join(", ")
									: "No days selected"}
								:
							</span>
							<span className="ml-2">
								{schedule.start_time} - {schedule.end_time}
							</span>
						</p>
					))}
				</div>

				<div className="flex items-baseline gap-4">
					<p className="text-sm text-muted-foreground mt-4 font-medium">
						Url: <span className="underline">{`${STATION_DEVICE_BASE_URL}/${toUrlSafeBase64(slot.id)}`}</span>
					</p>

					<CopyIcon onClick={() => handleCopyLink(slot.id)} className="h-4 w-auto" />
				</div>

				<p className="text-sm text-muted-foreground font-medium">Port: 443</p>

				<div className="mt-4 space-y-3">
					<div className="grid grid-cols-2 gap-3">
						<Button
							onClick={() => handleToggleCharging(slot.id, "start")}
							disabled={togglingCharge}
							variant="default"
							size="sm"
						>
							<Icons.PowerIcon className="mr-2 h-4 w-4" />
							Start Charging
						</Button>

						<Button
							onClick={() => handleToggleCharging(slot.id, "stop")}
							disabled={togglingCharge}
							variant="destructive"
							size="sm"
						>
							<Icons.PowerIcon className="mr-2 h-4 w-4" />
							Stop Charging
						</Button>
					</div>

					<div className="border-t pt-3">
						<p className="text-sm font-medium text-muted-foreground mb-2">Download QR Code</p>
						<div className="grid grid-cols-2 gap-3">
							<Button onClick={handleDownloadQRCodePDF} disabled={downloadingQR} variant="outline" size="sm">
								<Icons.FileTextIcon className="mr-2 h-4 w-4" />
								PDF
							</Button>

							<Button onClick={handleDownloadQRCodeImage} disabled={downloadingQR} variant="outline" size="sm">
								<Icons.QrCodeIcon className="mr-2 h-4 w-4" />
								PNG
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
