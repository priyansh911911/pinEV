"use client";

import { getStationsSlots } from "@/actions/stations-slots";
import { getVehiclesChargings } from "@/actions/vehicles-chargings";
import Header from "@/components/custom/header";
import Map from "@/components/custom/map";
import NearByStations from "@/components/custom/nearby-stations";
import { Icons } from "@/components/icons";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_LAT_LNG } from "@/lib/defaults";
import Stores from "@/lib/stores";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const HomePage = () => {
	const router = useRouter();
	const { user, isUserLoading, latLong } = Stores();

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [stations, setStations] = useState<StationWithNearby[]>([]);
	const [chargingSessions, setChargingSessions] = useState<VehicleCharging[]>([]);

	useEffect(() => {
		const fetchStations = async () => {
			if (!latLong?.latitude || !latLong?.longitude) {
				toast.error("Location not available. Please enable location services.");
				return;
			}

			setIsLoading(true);

			try {
				const res = await getStationsSlots({
					nearby: {
						latitude: latLong.latitude,
						longitude: latLong.longitude,
					},
					search: "status:active,station.status:approved",
				});

				console.log("res", res);

				if (res.err) {
					return;
				}

				const groupedByStations = res.result.reduce((acc: StationWithNearby[], slot: StationSlotWithNearby) => {
					const stationIndex = acc.findIndex(station => station.id === slot.station.id);

					if (stationIndex !== -1) {
						acc[stationIndex].slots.push({
							id: slot.id,
							name: slot.name,
							connector_type: slot.connector_type,
							power: slot.power,
							schedules: slot.schedules,
							status: slot.status,
							price_per_minute: slot.price_per_minute,
							active_connectors: slot.active_connectors,
							no_of_connector: slot.no_of_connector,
						});
					} else {
						acc.push({
							...slot.station,
							nearby: slot.nearby || 29,
							slots: [
								{
									id: slot.id,
									name: slot.name,
									connector_type: slot.connector_type,
									power: slot.power,
									schedules: slot.schedules,
									status: slot.status,
									price_per_minute: slot.price_per_minute,
									active_connectors: slot.active_connectors,
									no_of_connector: slot.no_of_connector,
								},
							],
						});
					}

					return acc;
				}, []);

				setStations(groupedByStations);

				// Fetch charging sessions
				const chargingRes = await getVehiclesChargings({
					search: "status:scheduled",
				});

				if (!chargingRes.err) {
					setChargingSessions(chargingRes.result);
				}
			} catch (error) {
				toast.error("Failed to fetch stations.");
				console.error("Error fetching stations:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchStations();
	}, [latLong?.latitude, latLong?.longitude]);

	return (
		<>
			<Header
				// left={
				// 	<Button variant="link" className="p-0 m-0">
				// 		<Icons.MenuIcon />
				// 	</Button>
				// }
				right={
					<Button
						onClick={() => router.push("/support")}
						variant="secondary"
						size="icon"
						className="rounded-full text-primary"
					>
						<Icons.HelpCircleIcon />
					</Button>
				}
				headerBackground="bg-gradient-to-b from-background to-transparent"
			>
				<Image src="/assets/images/logo-name.svg" alt="pin-logo" width={100} height={100} className="w-20 h-auto" />
			</Header>

			<Layout fullWidth className="pt-12 h-svh relative">
				<Map
					stations={stations}
					center={stations.length ? { lat: stations[0].latitude, lng: stations[0].longitude } : DEFAULT_LAT_LNG}
					chargingSessions={chargingSessions}
				/>
				<div className="absolute top-12 left-0 w-full bg-gradient-to-b from-background to-transparent">
					<div className="w-[90%] mx-auto pt-12">
						<h2 className="text-3xl">Hello!</h2>
						<h1 className="text-3xl font-semibold">{isUserLoading ? "..." : user?.name}</h1>

						{/* <div className="relative flex items-center rounded-md mt-12">
							<div className="absolute left-2 pr-2 border-r text-primary">
								<Icons.SearchIcon />
							</div>
							<Input placeholder="Search by location, merchant..." className="w-full text-xl pl-14" />
						</div> */}
					</div>

					{/* <div className="w-full max-w-full overflow-x-auto flex gap-4 mt-12 px-[5%]">
						<Button className="bg-background hover:bg-background/80 rounded-lg shadow-md ring-1 ring-secondary w-24">
							<Icons.FilterIcon className="text-[#272361]" />
						</Button>

						<FlatList
							data={FILTERS}
							keyExtractor={filter => filter}
							renderItem={filter => (
								<Button
									key={filter}
									variant="secondary"
									className="bg-background hover:bg-background/80 rounded-lg shadow-md ring-1 ring-secondary"
									rightIcon={<Icons.ChevronRightIcon className="text-[#272361] rotate-90 w-5 h-auto" />}
								>
									{filter}
								</Button>
							)}
						/>
					</div> */}
				</div>
				<div className="absolute bottom-32 left-0 w-full">
					<div className="w-full max-w-full overflow-x-auto flex gap-4 mt-12 px-[5%]">
						{/* <FlatList
							data={STATIONS}
							keyExtractor={station => station.id}
							renderItem={station => <StationCard station={station} />}
						/> */}

						<NearByStations stations={stations} />
					</div>
				</div>
			</Layout>
		</>
	);
};

export default HomePage;
