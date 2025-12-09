"use client";

import BottomTabs from "@/components/custom/bottom-tabs";
import Header from "@/components/custom/header";
import { Icons } from "@/components/icons";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PlanATripPage = () => {
	const router = useRouter();
	return (
		<>
			<Header
				// left={
				// 	<Button variant="link" className="p-0 m-0">
				// 		<Icons.MenuIcon className="text-background" />
				// 	</Button>
				// }
				right={
					<Button onClick={() => router.push("notifications")}
					variant="secondary" size="icon" className="rounded-full text-foreground">
						<Icons.BellIcon />
					</Button>
				}
			>
				<Image src="/assets/images/logo-name-light.svg" alt="pin-logo" width={100} height={100} className="w-20 h-auto" />
			</Header>

			<Layout fullWidth className="h-svh">
				<div className="h-[250px] w-full relative">
					<div className="absolute inset-0 bg-black">
						<Image
							src="/assets/images/header-bg.png"
							alt="pin-logo"
							width={100}
							height={100}
							className="object-cover w-full h-full"
						/>
					</div>
					<div className="absolute inset-0 pt-28">
						<div className="default-page-width space-y-4">
							<h1 className="text-background font-bold text-3xl">Plan A Trip</h1>

							<div className="w-full bg-background rounded-2xl overflow-hidden translate-y-3 shadow-lg">
								<div className="relative flex items-center rounded-md">
									<div className="absolute left-4 pr-4 text-black">
										<Icons.CircleDotIcon />
									</div>
									<Input
										placeholder="Starting Point"
										className="w-full py-6 text-lg pl-16 focus-visible:ring-0 rounded-none"
									/>
								</div>
								<div className="shadow-inner relative flex items-center rounded-md">
									<div className="absolute left-4 pr-4 text-black">
										<Icons.MapPinIcon />
									</div>
									<Input
										placeholder="Destination"
										className="w-full py-6 text-lg pl-16 focus-visible:ring-0 rounded-none"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<Layout className="mt-20 space-y-10">
					<div className="w-4/5 mx-auto">
						<h2 className="text-lg font-medium text-center">
							Show charging stations less than <span className="font-bold">10 km</span> away from the route
						</h2>
					</div>

					<Slider id="slider" defaultValue={[33]} max={100} step={1} />

					<div className="flex justify-center">
						<Link href="/plan-a-trip/routes">
							<Button className="rounded-full" size="xl">
								Find Routes
							</Button>
						</Link>
					</div>
				</Layout>

				<div className="mt-16">
					<div className="default-page-width flex items-center justify-between">
						<h2>Find EV Friendly Hotels</h2>

						<Button variant="link" className="p-0 m-0" onClick={() => router.push("view-all")}>
							View All
						</Button>
					</div>

					<div className="px-[5%] overflow-x-auto w-full flex items-center gap-4" onClick={() => router.push("ev-hotels")}>
						<div className="w-1/3 min-w-[150px] h-auto shrink-0 rounded-xl overflow-hidden">
							<Image src="/assets/images/hotel-1.png" alt="hotel" width={200} height={200} className="w-full" />
						</div>
						<div className="w-1/3 h-auto min-w-[150px] shrink-0 rounded-xl overflow-hidden">
							<Image src="/assets/images/hotel-2.png" alt="hotel" width={200} height={200} className="w-full" />
						</div>

						<div className="w-1/3 h-auto min-w-[150px] shrink-0 rounded-xl overflow-hidden">
							<Image src="/assets/images/hotel-1.png" alt="hotel" width={200} height={200} className="w-full" />
						</div>
						<div className="w-1/3 h-auto min-w-[150px] shrink-0 rounded-xl overflow-hidden">
							<Image src="/assets/images/hotel-2.png" alt="hotel" width={200} height={200} className="w-full" />
						</div>
					</div>
				</div>
			</Layout>
		</>
	);
};

export default PlanATripPage;
