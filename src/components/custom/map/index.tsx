import { FC, useMemo, useState } from "react";
import FlatList from "@/components/flat-list";
import Loader from "@/components/custom/loader";
import { GoogleMap, Libraries, MarkerF, useLoadScript } from "@react-google-maps/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StationCard from "../station-card";
import { getStationPinIcon } from "@/functions/station-availability";

interface MapProps {
	stations: StationWithNearby[];
	center: { lat: number; lng: number };
	bookings?: Booking[];
}

const Map: FC<MapProps> = ({ stations, center, bookings }) => {
	const [clickedStation, setClickedStation] = useState<StationWithNearby | null>(null);

	const libraries: Libraries = useMemo(() => ["places"], []);
	const mapCenter = useMemo(() => center, [center]);

	const googleAPI = useMemo(
		() =>
			process.env.NODE_ENV == "development"
				? process.env.NEXT_PUBLIC_LOCAL_GOOGLE_API_KEY
				: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
		[]
	) as string;

	const mapOptions = useMemo<google.maps.MapOptions>(
		() => ({
			disableDefaultUI: true,
			clickableIcons: true,
			scrollwheel: false,
			backgroundColor: "transparent",
			fullscreenControl: false,
		}),
		[]
	);

	const { isLoaded } = useLoadScript({
		googleMapsApiKey: googleAPI,
		libraries: libraries,
	});

	const nearestStation = useMemo(() => stations.sort((a, b) => a.nearby - b.nearby)[0], [stations]);

	if (!isLoaded) {
		return <Loader />;
	}

	const handleMarkerClick = (station: StationWithNearby) => {
		setClickedStation(station);

		const stationCardElement = document.getElementById(`station-${station.id}`);
		if (stationCardElement) {
			stationCardElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
		}
	};

	return (
		<div className="w-full h-full">
			<GoogleMap
				options={mapOptions}
				zoom={11}
				center={{
					lat: Number(nearestStation?.latitude || mapCenter.lat),
					lng: Number(nearestStation?.longitude || mapCenter.lng),
				}}
				mapTypeId={google.maps.MapTypeId.ROADMAP}
				mapContainerStyle={{ width: "100%", height: "100%" }}
			>
				<FlatList
					data={stations}
					keyExtractor={station => station.id}
					renderItem={station => (
						<MarkerF
							key={station.id}
							position={{
								lat: Number(station?.latitude || mapCenter.lat),
								lng: Number(station?.longitude || mapCenter.lng),
							}}
							icon={{
								url: getStationPinIcon(
									station,
									bookings,
									nearestStation.id === station.id
								),
								scaledSize: new google.maps.Size(32, 32)
							}}
							onClick={() => handleMarkerClick(station)}
							animation={google.maps.Animation.DROP}
						/>
					)}
				/>

				{clickedStation && (
					<Dialog open={!!clickedStation} onOpenChange={() => setClickedStation(null)}>
						<DialogContent className="rounded-lg">
							<DialogHeader>
								<DialogTitle className="text-left sr-only">{clickedStation?.name}</DialogTitle>
								<DialogDescription className="text-left sr-only">{clickedStation?.address}</DialogDescription>
							</DialogHeader>
							<StationCard id={`station-${clickedStation.id}-opened`} station={clickedStation} />
						</DialogContent>
					</Dialog>
				)}
			</GoogleMap>
		</div>
	);
};

export default Map;
