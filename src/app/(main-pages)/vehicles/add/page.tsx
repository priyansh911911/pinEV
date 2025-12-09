"use client";

import * as z from "zod";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// Components
import Header from "@/components/custom/header";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import CustomFormField from "@/components/custom/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Actions and Stores
import { createVehicle, getVehicles, updateVehicle } from "@/actions/vehicles";
import Stores from "@/lib/stores";
import { TWO_WHEELER_VEHICLES } from "@/lib/defaults";
import FourWheelerForm from "./FourWheelerForm";
import TwoWheelerForm from "./TwoWheelerForm";

// Validation schema using zod
const formSchema = z.object({
	vehicle_number: z.string().min(2, "Vehicle number is required").max(20, "Vehicle number is too long"),
	vehicle_type: z.string().min(2, "Vehicle type is required"),
	brand: z.string().min(2, "Brand is required"),
	model: z.string().min(2, "Model is required"),
	color: z.string().min(2, "Color is required"),
	year_of_manufacture: z.coerce
		.number()
		.int("Year must be a whole number")
		.min(1900, "Year must be at least 1900")
		.max(new Date().getFullYear(), `Year cannot exceed ${new Date().getFullYear()}`),
	battery_capacity: z.coerce.number().positive("Battery capacity must be positive").min(1, "Battery capacity is required"),
	range_per_charge: z.coerce.number().positive("Range per charge must be positive").min(1, "Range per charge is required"),
	image: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Vehicle types for dropdown (for 4 wheeler)
const vehicleTypes = [
	{ label: "Sedan", value: "Sedan" },
	{ label: "SUV", value: "Suv" },
	{ label: "Hatchback", value: "Hatchback" },
	{ label: "Crossover", value: "Crossover" },
	{ label: "Coupe", value: "Coupe" },
	{ label: "Convertible", value: "Convertible" },
	{ label: "Minivan", value: "Minivan" },
	{ label: "Pickup", value: "Pickup" },
];

// Common colors
const colorOptions = [
	{ label: "Black", value: "black" },
	{ label: "White", value: "white" },
	{ label: "Silver", value: "silver" },
	{ label: "Gray", value: "gray" },
	{ label: "Red", value: "red" },
	{ label: "Blue", value: "blue" },
	{ label: "Green", value: "green" },
	{ label: "Yellow", value: "yellow" },
	{ label: "Orange", value: "orange" },
	{ label: "Brown", value: "brown" },
	{ label: "Purple", value: "purple" },
];

const defaultDataToTest = {
	vehicle_number: "DL12AB1234",
	vehicle_type: "Suv",
	brand: "Tata",
	model: "Nexon EV",
	color: "Blue",
	year_of_manufacture: 2022,
	battery_capacity: 30,
	range_per_charge: 300,
};

// Tab UI and form switcher
const VehicleAdd = () => {
	const searchParams = useSearchParams();
	const vehicleId = searchParams.get("id");
	const returnTo = searchParams.get("returnTo") || "/profile";

	const [isFetching, setIsFetching] = useState(false);
	const [vehicle, setVehicle] = useState<Vehicle>();
	const [tab, setTab] = useState<"4w" | "2w">("4w");

	useEffect(() => {
		if (!vehicleId) return;
		const getVehicleData = async () => {
			setIsFetching(true);
			try {
				const res = await getVehicles({ search: `id:${vehicleId}` });
				if (res?.err || res.count === 0) return;

				console.log("res.result[0]", res.result[0]);

				if (res.result[0].details.vehicle_type === "2 wheeler") {
					setTab("2w");
				} else {
					setTab("4w");
				}

				setVehicle(res.result[0]);
			} finally {
				setIsFetching(false);
			}
		};
		getVehicleData();
	}, [vehicleId]);

	return (
		<>
			{/* Header remains unchanged */}
			<Header
				left={
					<Button onClick={() => history.back()} variant="ghost" size="icon" className="hover:bg-background">
						<Icons.ArrowLeftIcon className="h-5 w-5" />
					</Button>
				}
				headerBackground="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
			>
				<h1 className="text-xl font-semibold">Add Vehicle</h1>
			</Header>

			<Layout className="min-h-screen pb-10">
				<div className="h-24" />

				{/* Tab Switcher */}
				<div className="flex justify-center mb-6">
					<button
						className={`px-6 py-2 rounded-t-lg font-semibold border-b-2 ${
							tab === "4w" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
						}`}
						onClick={() => setTab("4w")}
						disabled={vehicleId && vehicle?.details?.vehicle_type === "2 wheeler" ? true : false}
					>
						4 Wheeler
					</button>
					<button
						className={`px-6 py-2 rounded-t-lg font-semibold border-b-2 ${
							tab === "2w" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
						}`}
						onClick={() => setTab("2w")}
						disabled={vehicleId && vehicle?.details?.vehicle_type !== "2 wheeler" ? true : false}
					>
						2 Wheeler
					</button>
				</div>

				{/* Form Switcher */}
				{tab === "4w" ? (
					<FourWheelerForm returnTo={returnTo} isFetching={isFetching} vehicle={vehicle} />
				) : (
					<TwoWheelerForm returnTo={returnTo} isFetching={isFetching} vehicle={vehicle} />
				)}
			</Layout>
		</>
	);
};

export default VehicleAdd;
