"use client";

import { toast } from "sonner";
import Stores from "@/lib/stores";
import Layout from "@/components/layout";
import Map from "@/components/custom/map";
import { Icons } from "@/components/icons";
import FlatList from "@/components/flat-list";
import { Button } from "@/components/ui/button";
import Loader from "@/components/custom/loader";
import Header from "@/components/custom/header";
import { Suspense, useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import Transition from "@/components/custom/transition";
import { Card, CardContent } from "@/components/ui/card";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import QRCodeScannerModal from "@/components/custom/qrcode-scanner-modal";

const StationDetailPage = () => {
	return (
		<Suspense fallback={<Loader />}>
			<Component />
		</Suspense>
	);
};

export default StationDetailPage;

const Component = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const id = searchParams.get("id");

	const [station, setStation] = useState<StationWithNearby | null>(null);
	const [openScanner, setOpenScanner] = useState(false);

	const { stationData, isStationDataLoading } = Stores();

	useEffect(() => {
		if (!isStationDataLoading) {
			return;
		}

		setStation(stationData || null);
	}, [isStationDataLoading, stationData]);

	if (!isStationDataLoading && (!id || !station)) {
		redirect("/home");
	}

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

		router.push(`/booking/scanned/station-slot?id=${slotId}`);
	};

	return (
		<>
			<Transition>
				<Header
					left={
						<Button onClick={() => router.back()} variant="link" className="p-0 m-0">
							<Icons.ArrowLeftIcon />
						</Button>
					}
					// right={
					// 	<Button variant="link" size="icon" className="p-0 m-0 text-foreground">
					// 		<Icons.ThreeDotIcon />
					// 	</Button>
					// }
					headerBackground="bg-gradient-to-b from-background via-background to-transparent"
				>
					<h1 className="line-clamp-1 text-lg font-semibold pr-10">{station?.name || ""}</h1>
				</Header>

				<Layout fullWidth className="h-svh flex flex-col justify-between">
					<div className="h-full w-full flex-2">
						<Map
							stations={station ? [station] : []}
							center={{
								lat: Number(station?.latitude || 0),
								lng: Number(station?.longitude || 0),
							}}
						/>
					</div>
					<div className="flex-1 h-full w-full bg-background rounded-t-xl shadow-lg">
						<div className="default-page-width py-4 space-y-6">
							<div className="flex items-start justify-between">
								<h2 className="text-lg font-semibold max-w-[70%]">{station?.name || ""}</h2>

								{/* <Button className="p-0 m-0" variant="link">
								<Icons.BookmarkIcon />
							</Button> */}
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Icons.NavigationIcon className="h-5 w-auto" />
									<p className="text-lg">{(station?.nearby || 0).toFixed()} kms</p>
								</div>

								<div className="flex items-center gap-2">
									<Icons.LocationIcon className="h-5 w-auto" />
									<p className="text-lg">{station?.address || ""}</p>
								</div>
							</div>

							<Separator />

							<h2 className="text-lg font-semibold">Devices ({station?.slots.length})</h2>
						</div>

						<div className="px-[5%] py-px flex items-center gap-4 overflow-x-auto">
							<FlatList
								data={station?.slots || []}
								keyExtractor={slot => slot.id}
								renderItem={slot => (
									<Card
										key={slot.id}
										className="min-w-48 hover:shadow-md transition-shadow duration-200 h-full flex flex-col"
									>
										<CardContent className="p-4 flex flex-col h-full">
											<div className="flex-1 flex flex-col space-y-2">
												<div className="flex items-center justify-between gap-2">
													<h3 className="text-lg font-semibold">{slot.name}</h3>
												</div>
												<p className="text-sm text-muted-foreground">Power: {slot.power} kW</p>
												<p className="text-sm text-muted-foreground">Type: {slot.connector_type}</p>
											</div>
										</CardContent>
									</Card>
								)}
							/>
						</div>

						<div className="default-page-width flex items-center gap-4 mt-10">
							<Button
								onClick={() => router.push(`/booking/schedule?id=${id}`)}
								variant="outline"
								className="w-full rounded-xl"
								size="lg"
							>
								Schedule
							</Button>
							<Button onClick={() => setOpenScanner(true)} className="w-full rounded-xl" size="lg">
								Scan QR
							</Button>
						</div>

						<div className="h-16"></div>
					</div>
				</Layout>
			</Transition>

			{openScanner && (
				<QRCodeScannerModal open={openScanner} onClose={() => setOpenScanner(false)} onScanResult={handleQRScan} />
			)}
		</>
	);
};
