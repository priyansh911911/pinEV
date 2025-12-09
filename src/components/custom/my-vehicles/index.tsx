import { getVehicles } from "@/actions/vehicles";
import { Icons } from "@/components/icons";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { FC, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface MyVehiclesProps {
	user: User;
}

const MyVehicles: FC<MyVehiclesProps> = ({ user }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);

	const handleGetVehicles = useCallback(async () => {
		setIsLoading(true);

		try {
			const res = await getVehicles({ search: `user:${user.id}` });

			if (res?.err) {
				return;
			}

			const vehicles: Vehicle[] = res.result.map((vehicle: any) => ({
				id: vehicle.id,
				user: vehicle.user,
				vehicle_number: vehicle.details.vehicle_number,
				vehicle_type: vehicle.details.vehicle_type,
				brand: vehicle.brand,
				model: vehicle.model,
				color: vehicle.color,
				year_of_manufacture: vehicle.details.year_of_manufacture,
				battery_capacity: vehicle.details.battery_capacity, // in kWh
				range_per_charge: vehicle.details.range_per_charge, // in km
				registration_date: new Date(vehicle.details.registration_date),
				last_service_date: vehicle.details.last_service_date ? new Date(vehicle.details.last_service_date) : null,
				is_deleted: vehicle.is_deleted,
				created_at: new Date(vehicle.created_at),
				updated_at: new Date(vehicle.updated_at),
				image: vehicle.image || "",
			}));

			setVehicles(vehicles);
		} catch (error) {
			toast.error("Failed to fetch vehicles");
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	useEffect(() => {
		handleGetVehicles();
	}, [handleGetVehicles]);

	return (
		<Layout>
			<div className="text-xl font-bold flex justify-between my-6">
				<h1>My Vehicles</h1>

				<Link href="/vehicles/add">
					<Button leftIcon={<Icons.PlusIcon />}>Add Vehicle</Button>
				</Link>
			</div>

			<div className="space-y-4">
				{isLoading ? (
					Array.from({ length: 2 }).map((_, index) => (
						<Card key={`skeleton-${index}`} className="p-4">
							<div className="flex gap-4 items-center">
								<Skeleton className="h-24 w-32 rounded-md" />
								<div className="space-y-2 flex-1">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-4 w-40" />
								</div>
							</div>
						</Card>
					))
				) : vehicles.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-muted-foreground">No vehicles found</p>
						<p className="text-sm text-muted-foreground">Add your first vehicle to get started</p>
					</div>
				) : (
					vehicles.map(vehicle => (
						<Card key={vehicle.id} className="p-4 hover:shadow-md transition-shadow">
							<div className="flex gap-4">
								<div className="relative w-32 h-24 overflow-hidden rounded-md">
									<Image
										src={
											vehicle.image
												? process.env.NEXT_PUBLIC_IMAGE_URL! + vehicle.image
												: "/assets/images/car.jpg"
										}
										alt={`${vehicle.brand} ${vehicle.model}`}
										fill
										className="object-contain"
									/>
								</div>
								<div className="flex-1">
									<div className="flex justify-between">
										<h3 className="font-semibold text-lg">
											{vehicle.brand} {vehicle.model}
										</h3>
										<Link href={`/vehicles?id=${vehicle.id}`}>
											<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
												<Icons.ChevronRightIcon className="h-4 w-4" />
											</Button>
										</Link>
									</div>
									<p className="text-muted-foreground">{vehicle.vehicle_number}</p>
									<div className="flex justify-between items-center mt-2">
										<div className="flex gap-4 text-sm text-muted-foreground">
											<div className="flex items-center gap-1">
												<Icons.BatteryIcon className="h-4 w-4" />
												<span>{vehicle.battery_capacity} kW</span>
											</div>
											<div className="flex items-center gap-1">
												<Icons.ActivityIcon className="h-4 w-4" />
												<span>{vehicle.range_per_charge} km</span>
											</div>
										</div>

										<Link href={`/vehicles/add?id=${vehicle.id}`}>
											<Button variant="outline" size="sm" className="h-8">
												<Icons.EditIcon className="h-4 w-4" />
												<span className="ml-1">Edit</span>
											</Button>
										</Link>
									</div>
								</div>
							</div>
						</Card>
					))
				)}
			</div>

			<div className="h-40"></div>
		</Layout>
	);
};

export default MyVehicles;
