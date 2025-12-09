"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Loader from "@/components/custom/loader";
import Header from "@/components/custom/header";
import { Icons } from "@/components/icons";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import Transition from "@/components/custom/transition";
import { getVehicles } from "@/actions/vehicles";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

const VehicleDetails = () => {
	return (
		<Suspense fallback={<Loader />}>
			<Component />
		</Suspense>
	);
};

export default VehicleDetails;

const Component = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const vehicleId = searchParams.get("id");

	const [vehicle, setVehicle] = useState<Vehicle | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const handleGetVehicle = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await getVehicles({ search: `id:${vehicleId}` });

			if (res.err || res.count === 0) {
				return;
			}

			const vehicle = res.result[0];

			const vehicleData: Vehicle = {
				id: vehicle.id,
				user: vehicle.user,
				brand: vehicle.brand,
				model: vehicle.model,
				year_of_manufacture: vehicle.details.year_of_manufacture,
				vehicle_number: vehicle.details.vehicle_number,
				vehicle_type: vehicle.details.vehicle_type,
				color: vehicle.color,
				battery_capacity: vehicle.details.battery_capacity,
				range_per_charge: vehicle.details.range_per_charge,
				registration_date: vehicle.details.registration_date,
				last_service_date: vehicle.details.last_service_date,
				is_deleted: vehicle.is_deleted,
				image: vehicle.image,
				created_at: vehicle.created_at,
				updated_at: vehicle.updated_at,
			};

			setVehicle(vehicleData);
		} catch (error) {
			console.error("Failed to fetch vehicle details:", error);
		} finally {
			setIsLoading(false);
		}
	}, [vehicleId]);

	useEffect(() => {
		handleGetVehicle();
	}, [handleGetVehicle]);

	// Helper function to calculate vehicle age
	const getVehicleAge = (year: number) => {
		const currentYear = new Date().getFullYear();
		return currentYear - year;
	};

	if (isLoading) {
		return (
			<Transition>
				<Header
					left={
						<Button onClick={() => router.back()} variant="link" className="p-0 m-0">
							<Icons.ArrowLeftIcon className="text-foreground" />
						</Button>
					}
					headerBackground="bg-background"
				>
					<h1 className="font-semibold text-lg">Vehicle Details</h1>
				</Header>
				<Layout>
					<div className="flex items-center justify-center h-full">
						<Loader />
					</div>
				</Layout>
			</Transition>
		);
	}

	if (!vehicle) {
		return (
			<Transition>
				<Header
					left={
						<Button onClick={() => router.back()} variant="link" className="p-0 m-0">
							<Icons.ArrowLeftIcon className="text-foreground" />
						</Button>
					}
					headerBackground="bg-background"
				>
					<h1 className="font-semibold text-lg">Vehicle Details</h1>
				</Header>
				<Layout>
					<div className="h-24"></div>
					<div className="flex flex-col items-center justify-center h-64">
						<Icons.AlertTriangleIcon className="h-12 w-12 text-muted-foreground mb-4" />
						<h2 className="text-xl font-semibold text-center">Vehicle Not Found</h2>
						<p className="text-muted-foreground text-center mt-2">
							The vehicle you&apos;re looking for doesn&apos;t exist or was removed
						</p>
						<Button onClick={() => router.push("/vehicles/add")} className="mt-6">
							Add New Vehicle
						</Button>
					</div>
				</Layout>
			</Transition>
		);
	}

	// Calculate estimated battery percentage (for visual purposes)
	// This is a simulation since we don't have real-time battery data
	const batteryPercentage = Math.min(100, Math.round((vehicle.range_per_charge / 400) * 100));

	// Calculate estimated remaining range (70% of max range for demonstration)
	const remainingRange = Math.round(vehicle.range_per_charge * 0.7);

	return (
		<Transition>
			<Header
				left={
					<Button onClick={() => router.back()} variant="link" className="p-0 m-0">
						<Icons.ArrowLeftIcon className="text-foreground" />
					</Button>
				}
				// right={
				// 	<Button
				// 		variant="outline"
				// 		size="icon"
				// 		className="rounded-full"
				// 		onClick={() => router.push(`/vehicles/edit?id=${vehicle.id}`)}
				// 	>
				// 		<Icons.EditIcon className="h-4 w-4" />
				// 	</Button>
				// }
				headerBackground="bg-background"
			>
				<h1 className="font-semibold text-lg">Vehicle Details</h1>
			</Header>
			<Layout className="pb-20">
				<div className="h-20"></div>

				{/* Vehicle Header */}
				<div className="mb-6">
					<div className="flex items-center">
						<h2 className="font-bold text-2xl">
							{vehicle.brand} {vehicle.model}
						</h2>
						<Badge className="ml-3 bg-primary/20 text-primary hover:bg-primary/30">
							{vehicle.year_of_manufacture}
						</Badge>
					</div>
					<p className="text-muted-foreground font-medium mt-1">{vehicle.vehicle_number}</p>
				</div>

				{/* Vehicle Image */}
				<div className="relative w-full h-48 mb-6 rounded-xl overflow-hidden">
					<Image
						src={vehicle.image ? process.env.NEXT_PUBLIC_IMAGE_URL! + vehicle.image : "/assets/images/car.jpg"}
						alt={`${vehicle.brand} ${vehicle.model}`}
						fill
						className="object-contain size-full"
					/>
				</div>

				{/* Vehicle Specs */}
				<div className="grid grid-cols-2 gap-4 mb-6">
					<Card className="p-4 flex flex-col justify-between bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
						<div className="flex items-center mb-2">
							<Icons.BatteryIcon className="h-5 w-5 mr-2 text-primary" />
							<h3 className="text-sm font-medium text-muted-foreground">Battery Capacity</h3>
						</div>
						<p className="text-2xl font-bold">
							{vehicle.battery_capacity} <span className="text-lg">kW</span>
						</p>
					</Card>

					<Card className="p-4 flex flex-col justify-between bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
						<div className="flex items-center mb-2">
							<Icons.ActivityIcon className="h-5 w-5 mr-2 text-green-500" />
							<h3 className="text-sm font-medium text-muted-foreground">Max Range</h3>
						</div>
						<p className="text-2xl font-bold">
							{vehicle.range_per_charge} <span className="text-lg">km</span>
						</p>
					</Card>
				</div>

				{/* Battery Status - Simulated */}
				{/* <Card className="p-5 mb-6">
					<h3 className="font-semibold text-lg mb-4">Battery Status</h3>

					<div className="flex justify-between items-center mb-1">
						<span className="text-muted-foreground">Current Charge</span>
						<span className="font-medium">{batteryPercentage}%</span>
					</div>

					<div className="w-full h-3 bg-slate-200 rounded-full mb-4 overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-300"
							style={{ width: `${batteryPercentage}%` }}
						/>
					</div>

					<div className="flex justify-between">
						<div className="text-center">
							<p className="text-muted-foreground text-sm">Est. Remaining</p>
							<p className="font-bold text-lg">{remainingRange} km</p>
						</div>

						<div className="text-center">
							<p className="text-muted-foreground text-sm">Full Charge</p>
							<p className="font-bold text-lg">{vehicle.range_per_charge} km</p>
						</div>
					</div>
				</Card> */}

				{/* Vehicle Details */}
				<Card className="p-5 mb-6">
					<h3 className="font-semibold text-lg mb-4">Vehicle Details</h3>

					<div className="space-y-3">
						<div className="flex justify-between">
							<p className="text-muted-foreground">Type</p>
							<p className="font-medium capitalize">{vehicle.vehicle_type}</p>
						</div>
						<Separator />

						<div className="flex justify-between">
							<p className="text-muted-foreground">Color</p>
							<div className="flex items-center">
								<div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: vehicle.color }}></div>
								<p className="font-medium capitalize">{vehicle.color}</p>
							</div>
						</div>
						<Separator />

						<div className="flex justify-between">
							<p className="text-muted-foreground">Age</p>
							<p className="font-medium">{getVehicleAge(vehicle.year_of_manufacture)} years</p>
						</div>
						<Separator />

						<div className="flex justify-between">
							<p className="text-muted-foreground">Registration Date</p>
							<p className="font-medium">
								{vehicle.registration_date ? format(new Date(vehicle.registration_date), "dd MMM yyyy") : "N/A"}
							</p>
						</div>

						{vehicle.last_service_date && (
							<>
								<Separator />
								<div className="flex justify-between">
									<p className="text-muted-foreground">Last Service</p>
									<p className="font-medium">{format(new Date(vehicle.last_service_date), "dd MMM yyyy")}</p>
								</div>
							</>
						)}
					</div>
				</Card>

				{/* Action Buttons */}
				<div className="flex gap-3">
					<Button variant="outline" className="flex-1 gap-2" onClick={() => router.push(`/bookings`)}>
						<Icons.CalendarIcon className="h-4 w-4" />
						Book Charging
					</Button>

					<Button className="flex-1 gap-2 bg-primary" onClick={() => router.push("/")}>
						<Icons.ChargingStationIcon className="h-4 w-4" />
						Find Stations
					</Button>
				</div>
			</Layout>
		</Transition>
	);
};
