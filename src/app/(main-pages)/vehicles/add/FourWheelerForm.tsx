import React, { useEffect, useState } from "react";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Header from "@/components/custom/header";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import CustomFormField from "@/components/custom/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createVehicle, getVehicles, updateVehicle } from "@/actions/vehicles";
import Stores from "@/lib/stores";

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
interface FourWheelerFormProps {
	returnTo: string;
	isFetching: boolean;
	vehicle: any;
}

const FourWheelerForm = ({ returnTo, isFetching, vehicle }: FourWheelerFormProps) => {
	const router = useRouter();

	const [isLoading, setIsLoading] = useState(false);
	const { user } = Stores();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			vehicle_number: "",
			vehicle_type: "",
			brand: "",
			model: "",
			color: "",
			year_of_manufacture: new Date().getFullYear(),
			battery_capacity: 0,
			range_per_charge: 0,
		},
	});

	useEffect(() => {
		if (!vehicle) return;
		form.reset({
			vehicle_number: vehicle?.details?.vehicle_number,
			vehicle_type: vehicle?.details?.vehicle_type,
			brand: vehicle?.brand,
			model: vehicle?.model,
			color: vehicle?.color,
			year_of_manufacture: vehicle?.details?.year_of_manufacture,
			battery_capacity: vehicle?.details?.battery_capacity,
			range_per_charge: vehicle?.details?.range_per_charge,
			image: vehicle?.image || "",
		});
	}, [vehicle, form]);

	const onSubmit = async (data: FormValues) => {
		if (!user?.id) {
			toast.error("User not found. Please log in.");
			return;
		}
		setIsLoading(true);
		try {
			const body = {
				user: user.id,
				brand: data.brand,
				model: data.model,
				color: data.color,
				is_deleted: false,
				details: {
					vehicle_number: data.vehicle_number,
					vehicle_type: data.vehicle_type,
					year_of_manufacture: data.year_of_manufacture,
					battery_capacity: data.battery_capacity,
					range_per_charge: data.range_per_charge,
					registration_date: new Date(),
				},
				image: data.image,
			};
			if (vehicle) {
				const res = await updateVehicle({ id: vehicle.id, body });
				if (res?.err) {
					toast.error("Failed to update vehicle");
					return;
				}
				toast.success("Vehicle updated successfully");
			} else {
				const res = await createVehicle({ body });
				if (res?.err) {
					toast.error("Failed to create vehicle");
					return;
				}
				toast.success("Vehicle added successfully");
			}
			router.replace(returnTo);
		} finally {
			setIsLoading(false);
		}
	};

	const currentYear = new Date().getFullYear();
	const yearOptions = Array.from({ length: currentYear - 1899 }, (_, i) => ({
		label: String(currentYear - i),
		value: String(currentYear - i),
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle>Vehicle Information</CardTitle>
				<CardDescription>Fill in the details below to add your electric vehicle.</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="grid gap-4 md:grid-cols-2">
							<CustomFormField
								control={form.control}
								name="vehicle_number"
								type="text"
								component="input"
								placeholder="Enter vehicle plate number"
								label="Vehicle Number/Plate"
								leftIcon={<Icons.CarIcon className="text-primary" />}
							/>
							<CustomFormField
								control={form.control}
								name="vehicle_type"
								type="select"
								component="select"
								placeholder="Select vehicle type"
								label="Vehicle Type"
								leftIcon={<Icons.CarIcon className="text-primary" />}
								options={vehicleTypes}
							/>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<CustomFormField
								control={form.control}
								name="brand"
								type="text"
								component="input"
								placeholder="Enter brand name"
								label="Brand"
								leftIcon={<Icons.BadgeCheckIcon className="text-primary" />}
							/>
							<CustomFormField
								control={form.control}
								name="model"
								type="text"
								component="input"
								placeholder="Enter model name"
								label="Model"
								leftIcon={<Icons.TagIcon className="text-primary" />}
							/>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<CustomFormField
								control={form.control}
								name="color"
								type="select"
								component="select"
								placeholder="Select color"
								label="Color"
								leftIcon={<Icons.PaletteIcon className="text-primary" />}
								options={colorOptions}
							/>
							<CustomFormField
								control={form.control}
								name="year_of_manufacture"
								type="select"
								component="select"
								placeholder="Select year"
								label="Year of Manufacture"
								leftIcon={<Icons.CalendarIcon className="text-primary" />}
								options={yearOptions}
							/>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<CustomFormField
								control={form.control}
								name="battery_capacity"
								type="number"
								component="input"
								placeholder="Enter capacity in kW"
								label="Battery Capacity (kW)"
								leftIcon={<Icons.BatteryIcon className="text-primary" />}
							/>
							<CustomFormField
								control={form.control}
								name="range_per_charge"
								type="number"
								component="input"
								placeholder="Enter range in km"
								label="Range per Charge (km)"
								leftIcon={<Icons.ActivityIcon className="text-primary" />}
							/>
						</div>
						<CustomFormField
							control={form.control}
							name="image"
							type="file"
							component="file"
							placeholder="Upload Vehicle Image"
							label="Vehicle Image"
							leftIcon={<Icons.UploadIcon className="text-primary" />}
							uploadFolderName="vehicles"
						/>
						<div className="flex justify-end gap-4">
							<Button disabled={isLoading} type="button" variant="outline" onClick={() => form.reset()}>
								Reset
							</Button>
							<Button isLoading={isLoading} type="submit" className="gap-2">
								<Icons.CheckIcon className="h-4 w-4" /> Add Vehicle
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};

export default FourWheelerForm;
