"use client";

import Header from "@/components/custom/header";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout";
import Map from "@/components/custom/map";
import { DEFAULT_LAT_LNG, STATIONS } from "@/lib/defaults";
import { useRouter } from "next/navigation";
import Transition from "@/components/custom/transition";

const PlanATripLocation = () => {
	const router = useRouter();

	return (
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
				<h1 className="line-clamp-1 text-lg font-semibold pr-10">NH75</h1>
			</Header>
			<Layout fullWidth className="h-svh flex flex-col justify-between">
				<div className="h-full w-full">{/* <Map stations={[STATIONS[0]]} center={DEFAULT_LAT_LNG} /> */}</div>
				<div className="default-page-width w-full py-8">
					<p className="mb-4 text-gray-500 font-semibold">Total trip: 1hr 12min (0.5km)</p>
					<p className="flex items-start gap-2">
						<Icons.InfoIcon className="w-6 mt-1" />
						<span>Select a charging station on the map or onlist to add stop to your trip</span>
					</p>
					<hr className="my-4" />
					<div className="flex gap-4 w-full">
						<div className="flex flex-col justify-between gap-10">
							<Icons.HomeIcon className="text-green-500 w-6" />
							<Icons.LocationIcon className="text-gray-600 w-6 mb-8" />
						</div>
						<div className="w-full">
							<p className="text-lg">Start Point</p>
							<p className="mt-2">Udipi Garden Park, Karnataka</p>
							<div className="mt-2 flex border rounded-lg py-4 px-2 justify-between w-full">
								<div className="flex gap-2">
									<Icons.MapPinIcon />
									<p>Sangeetha Mobiles Gharepalya EV...</p>
								</div>
								{/* <Icons.PlusIcon className="w-6" /> */}
							</div>
							{/* <div className="mt-2 flex bg-gray-100 rounded-lg py-4 px-2 justify-between w-full">
								<div className="flex gap-2">
									<Icons.MapPinIcon />
									<p>Sangeetha Mobiles Gharepalya EV...</p>
								</div>
								<Icons.PlusIcon className="w-6" />
							</div> */}
							<p className="text-lg mt-6">Destination</p>
							<p className="mt-2">Mangalore Hotel, Karnataka</p>
						</div>
					</div>
				</div>
				<div className="h-40"></div>
			</Layout>
		</Transition>
	);
};

export default PlanATripLocation;
