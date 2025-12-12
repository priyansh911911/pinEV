"use client";

import * as z from "zod";
import Layout from "@/components/layout";
import { useForm } from "react-hook-form";
import { Icons } from "@/components/icons";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomFormField from "@/components/custom/form-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { createStation } from "@/actions/stations";
import Stores from "@/lib/stores";
import { getPosition } from "@/functions/address";

const formSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	address: z.string().min(5, "Address must be at least 5 characters"),
	phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
	email: z.string().email("Invalid email address"),
	code: z.string().min(3, "Station code must be at least 3 characters"),
	manager: z.string().min(2, "Manager name must be at least 2 characters"),
	assigned_name: z.string().optional(),
	assigned_phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
	name: "Central Station",
	address: "123 Main St",
	phone: "1234567890",
	email: "central@station.com",
	code: "CS001",
	manager: "John Doe",
};

const StationAddPage = () => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const { user, setIsLocating, setLatLong, isLocating, latLong } = Stores();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			address: "",
			phone: "",
			email: "",
			code: "",
			manager: "",
			assigned_name: "",
			assigned_phone: "",
		},
	});

	const onSubmit = async (data: FormValues) => {
		setIsLoading(true);

		try {
			const body = {
				user: user?.id,
				name: data.name,
				address: data.address,
				code: data.code,
				details: {
					phone: data.phone,
					email: data.email,
					manager: data.manager,
				},
				status: "pending",
				is_deleted: false,
				latitude: latLong?.latitude || 0,
				longitude: latLong?.longitude || 0,
				assigned_name: data.assigned_name || null,
				assigned_phone: data.assigned_phone || null,
			};

			const res = await createStation({ body });

			if (res.err) {
				toast.error("Failed to create station");
				return;
			}

			toast.success("Station created successfully");
		} catch (error) {
			toast.error("Failed to create station");
			// Optionally, you can show an error message to the user
			return;
		} finally {
			setIsLoading(false);
		}

		router.push("/admin/stations");
	};

	return (
		<>
			<Header
				left={
					<Button onClick={() => router.back()} variant="ghost" size="icon" className="hover:bg-background">
						<Icons.ArrowLeftIcon className="h-5 w-5" />
					</Button>
				}
				right={
					<Button onClick={() => router.push("/admin/stations")} variant="outline" size="sm" className="gap-2">
						<Icons.EyeIcon className="h-4 w-4" /> View All
					</Button>
				}
				headerBackground="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
			>
				<h1 className="text-xl font-semibold">Create Station</h1>
			</Header>

			<Layout className="min-h-screen pb-10">
				<div className="h-24" />

				<div className="container max-w-2xl">
					<Card>
						<CardHeader>
							<CardTitle>Station Information</CardTitle>
							<CardDescription>Fill in the details below to create a new charging station.</CardDescription>
						</CardHeader>
						<CardContent>
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
									<div className="grid gap-4 md:grid-cols-2">
										<div className="bg-primary/10 p-4 rounded-md">
											<div className="flex gap-2 mb-4">
												<Icons.MapPinIcon className="h-6 w-6 text-primary" />

												{isLocating ? (
													<p>Locating...</p>
												) : latLong?.latitude && latLong?.longitude ? (
													<div className="space-y-1">
														<p>Lat: {latLong.latitude.toFixed(6)}</p>
														<p>Long: {latLong.longitude.toFixed(6)}</p>
													</div>
												) : (
													<p>Unknown Location</p>
												)}
											</div>

											<div className="flex items-center justify-end">
												<Button
													variant="outline"
													size="sm"
													type="button"
													onClick={() => getPosition(setIsLocating, setLatLong)}
													className="text-primary hover:bg-primary/20"
												>
													<Icons.RefreshCcwIcon className="h-4 w-4" />
													Refresh Location
												</Button>
											</div>
										</div>

										<CustomFormField
											control={form.control}
											name="name"
											type="text"
											component="input"
											placeholder="Enter station name"
											label="Station Name"
											leftIcon={<Icons.ChargingStationIcon className="text-primary" />}
										/>

										<CustomFormField
											control={form.control}
											name="code"
											type="text"
											component="input"
											placeholder="Enter station code"
											label="Station Code"
											leftIcon={<Icons.BookmarkIcon className="text-primary" />}
										/>
									</div>

									<CustomFormField
										control={form.control}
										name="address"
										type="text"
										component="textarea"
										placeholder="Enter complete address"
										label="Station Address"
									/>

									<div className="grid gap-4 md:grid-cols-2">
										<CustomFormField
											control={form.control}
											name="phone"
											type="tel"
											component="input"
											placeholder="Enter phone number"
											label="Phone Number"
											leftIcon={<Icons.PhoneIcon className="text-primary" />}
										/>

										<CustomFormField
											control={form.control}
											name="email"
											type="email"
											component="input"
											placeholder="Enter email address"
											label="Email Address"
											leftIcon={<Icons.MailIcon className="text-primary" />}
										/>
									</div>

									<CustomFormField
										control={form.control}
										name="manager"
										type="text"
										component="input"
										placeholder="Enter manager name"
										label="Manager Name"
										leftIcon={<Icons.UserIcon className="text-primary" />}
									/>

									<div className="grid gap-4 md:grid-cols-2">
										<CustomFormField
											control={form.control}
											name="assigned_name"
											type="text"
											component="input"
											placeholder="Enter CPO name"
											label="Assigned CPO Name (Optional)"
											leftIcon={<Icons.UserIcon className="text-primary" />}
										/>

										<CustomFormField
											control={form.control}
											name="assigned_phone"
											type="tel"
											component="input"
											placeholder="Enter CPO phone"
											label="Assigned CPO Phone (Optional)"
											leftIcon={<Icons.PhoneIcon className="text-primary" />}
										/>
									</div>

									<div className="flex justify-end gap-4">
										<Button disabled={isLoading} type="button" variant="outline" onClick={() => {
											form.reset();
										}}>
											Reset
										</Button>
										<Button isLoading={isLoading} type="submit" className="gap-2">
											<Icons.CheckIcon className="h-4 w-4" /> Create Station
										</Button>
									</div>
								</form>
							</Form>
						</CardContent>
					</Card>
				</div>
			</Layout>
		</>
	);
};

export default StationAddPage;
