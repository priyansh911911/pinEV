import { Icons } from "@/components/icons";
import Stores from "@/lib/stores";
import { useRouter } from "next/navigation";
import { FC } from "react";

interface StationCardProps {
	id: string;
	station: StationWithNearby;
}

const StationCard: FC<StationCardProps> = ({ id, station }) => {
	const router = useRouter();
	const { setStationData } = Stores();

	return (
		<div
			id={id}
			// href={`/stations/view/?id=${station.id}`}
			onClick={async () => {
				await setStationData(station);
				setTimeout(() => {
					router.push(`/stations/view/?id=${station.id}`);
				}, 100);
			}}
			className="p-4 rounded-xl shadow-lg bg-background min-w-[320px] space-y-4 flex justify-between flex-col cursor-pointer hover:bg-secondary transition-colors"
		>
			<div className="flex items-start justify-between">
				<h2 className="text-lg font-semibold max-w-56">{station.name}</h2>

				{/* <Button className="p-0 m-0" variant="link">
					<Icons.BookmarkIcon />
				</Button> */}
			</div>

			<div className="flex-1 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icons.NavigationIcon className="h-5 w-auto" />
					<p className="text-lg">{station.nearby.toFixed()} kms</p>
				</div>
				<div className="flex items-center gap-2">
					<Icons.LocationIcon className="h-5 w-auto" />
					<p className="text-lg">{station.address}</p>
				</div>
			</div>

			{/* TODO: Add actual connectors */}
			<div className="flex items-center justify-between">
				<p className="text-lg">No of Devices</p>
				<p className="text-lg">{station.slots.length}</p>
				{/* <div className="flex items-center gap-2">
					<FlatList
						data={STATIONS[0].connectors}
						keyExtractor={item => item}
						renderItem={item => (
							<Image src={`/assets/icons/connector-${item}.svg`} alt={item} width={24} height={24} />
						)}
					/>
				</div> */}
			</div>
		</div>
	);
};

export default StationCard;

// 101994490181
