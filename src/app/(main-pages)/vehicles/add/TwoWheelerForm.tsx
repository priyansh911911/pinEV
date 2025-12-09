import React, { useEffect, useState } from "react";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import CustomFormField from "@/components/custom/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { TWO_WHEELER_VEHICLES } from "@/lib/defaults";
import Stores from "@/lib/stores";
import { createVehicle, updateVehicle } from "@/actions/vehicles";

const formSchema = z.object({
	vehicle_number: z.string().min(2, "Vehicle number is required").max(20, "Vehicle number is too long"),
	vehicle_type: z.literal("2 wheeler"),
	brand: z.string().min(1, "Brand is required"),
	model: z.string().min(1, "Model is required"),
	color: z.string().min(2, "Color is required"),
	year_of_manufacture: z.coerce
		.number()
		.int("Year must be a whole number")
		.min(1900, "Year must be at least 1900")
		.max(new Date().getFullYear(), `Year cannot exceed ${new Date().getFullYear()}`),
	battery_capacity: z.string().min(1, "Battery capacity is required"),
	connector_type: z.enum(["type1", "type2", "type3"]),
	image: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const vehicleTypes = [{ label: "2 Wheeler", value: "2 wheeler" }];

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

const brandOptions = Array.from(new Set(TWO_WHEELER_VEHICLES.map(v => v.make))).map(make => ({ label: make, value: make }));

const getModelOptions = (brand: string) =>
	TWO_WHEELER_VEHICLES.filter(v => v.make === brand).map(v => ({ label: v.model, value: v.model }));

interface TwoWheelerFormProps {
	returnTo: string;
	isFetching: boolean;
	vehicle: any;
}

const TwoWheelerForm = ({ returnTo, isFetching, vehicle }: TwoWheelerFormProps) => {
	const router = useRouter();
	const { user } = Stores();
	const [selectedBrand, setSelectedBrand] = useState<string>("");
	const [selectedModel, setSelectedModel] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			vehicle_number: "",
			vehicle_type: "2 wheeler",
			brand: "",
			model: "",
			color: "",
			year_of_manufacture: undefined,
			battery_capacity: "",
			connector_type: "type1" as const,
			image: "",
		},
	});

	const brand = form.watch("brand");
	const model = form.watch("model");

	useEffect(() => {
		if (brand && model) {
			const found = TWO_WHEELER_VEHICLES.find(v => v.make === brand && v.model === model);
			if (found) {
				form.setValue("battery_capacity", found.battery_capacity || "");
				form.setValue("image", found.image || null);
			}
		}
	}, [brand, model, form]);

	useEffect(() => {
		if (!vehicle) return;
		console.log(vehicle);

		form.reset({
			vehicle_number: vehicle?.details?.vehicle_number,
			vehicle_type: vehicle?.details?.vehicle_type,
			brand: vehicle?.brand,
			model: vehicle?.model,
			color: vehicle?.color,
			year_of_manufacture: vehicle?.details?.year_of_manufacture,
			battery_capacity: vehicle?.details?.battery_capacity,
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
				<CardTitle>2 Wheeler Information</CardTitle>
				<CardDescription>Select a brand/model to prefill details. You can edit any field.</CardDescription>
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
								type="select"
								component="select"
								placeholder="Select brand"
								label="Brand"
								leftIcon={<Icons.BadgeCheckIcon className="text-primary" />}
								options={brandOptions}
							/>
							<CustomFormField
								control={form.control}
								name="model"
								type="select"
								component="select"
								placeholder="Select model"
								label="Model"
								leftIcon={<Icons.TagIcon className="text-primary" />}
								options={getModelOptions(form.watch("brand"))}
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
						<CustomFormField
							control={form.control}
							name="battery_capacity"
							type="text"
							component="input"
							placeholder="Battery Capacity (kW)"
							label="Battery Capacity (kW)"
							leftIcon={<Icons.BatteryIcon className="text-primary" />}
						/>

						<CustomFormField
							control={form.control}
							name="image"
							type="file"
							component="file"
							placeholder="Upload Vehicle Image"
							label="Vehicle Image"
							leftIcon={<Icons.UploadIcon className="text-primary" />}
							uploadFolderName="vehicles"
							fileUrl={form.watch("image") || undefined}
						/>

						<div className="flex justify-end gap-4">
							<Button disabled={isLoading} type="button" variant="outline" onClick={() => form.reset()}>
								Reset
							</Button>
							<Button isLoading={isLoading} type="submit" className="gap-2">
								<Icons.CheckIcon className="h-4 w-4" /> Add 2 Wheeler
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};

export default TwoWheelerForm;
