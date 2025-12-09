"use client";
import Header from "@/components/custom/header";
import Map from "@/components/custom/map";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DEFAULT_LAT_LNG, STATIONS } from "@/lib/defaults";
import Layout from "@/components/layout";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import Transition from "@/components/custom/transition";

const PlanATripMap = () => {
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
				<h1 className="line-clamp-1 text-lg font-semibold pr-10">Find Routes</h1>
			</Header>
			<Layout fullWidth className="h-svh flex flex-col justify-between">
				<div className="h-full w-full">{/* <Map stations={[STATIONS[0]]} center={DEFAULT_LAT_LNG} /> */}</div>
				<div className="default-page-width w-full h-full py-10 rounded-t-3xl">
					<p className="mb-4 text-gray-500 font-semibold">Select a route</p>
					<div>
						<RadioGroup defaultValue="option-one">
							<div className="flex justify-between items-center space-x-2">
								<div className="flex items-center space-x-4">
									<RadioGroupItem value="option-one" id="option-one" className="" />
									<Label htmlFor="option-one" className="leading-6">
										<span className="text-lg font-bold">Via NH75</span> <br />
										(0.3km) <span className="text-green-500 font-semibold">1min 30sec</span> <br />
										<span className="font-semibold">Available 10 Charging points</span>
									</Label>
								</div>
								{/* <Button className="bg-black rounded-full w-10 h-10 p-2">
									<Icons.RighSignIcon className="" />
								</Button> */}
							</div>
							<hr className="my-2" />
							<div className="flex justify-between items-center space-x-2">
								<div className="flex items-center space-x-4">
									<RadioGroupItem value="option-two" id="option-two" />
									<Label htmlFor="option-two" className="leading-6">
										<span className="text-lg font-semibold">Via vishweshwaraya road</span>
										<br />
										<span className="text-orange-300">2min</span> <br />
										No charging points available
									</Label>
								</div>
								{/* <Button className="bg-gray-200 rounded-full w-10 h-10 p-2">
									<Icons.RighSignIcon className="text-gray-600" />
								</Button> */}
							</div>
						</RadioGroup>
						<div className="h-10"></div>
						<Button onClick={() => router.push("/plan-a-trip/start")} size="xl" className="rounded-3xl w-full mt-10">
							Plan This Trip
						</Button>
					</div>
				</div>
			</Layout>
		</Transition>
	);
};

export default PlanATripMap;
