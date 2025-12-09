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

const formSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	address: z.string().min(5, "Address must be at least 5 characters"),
	phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
	email: z.string().email("Invalid email address"),
	stationCode: z.string().min(3, "Station code must be at least 3 characters"),
	manager: z.string().min(2, "Manager name must be at least 2 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const StationAddPage = () => {
	const router = useRouter();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			address: "",
			phone: "",
			email: "",
			stationCode: "",
			manager: "",
		},
	});

	const onSubmit = async (data: FormValues) => {
		console.log("Form data:", data);
		// TODO: Implement form submission
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
										<CustomFormField
											control={form.control}
											name="name"
											type="text"
											component="input"
											placeholder="Enter station name"
											label="Station Name"
										/>

										<CustomFormField
											control={form.control}
											name="stationCode"
											type="text"
											component="input"
											placeholder="Enter station code"
											label="Station Code"
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
										/>

										<CustomFormField
											control={form.control}
											name="email"
											type="email"
											component="input"
											placeholder="Enter email address"
											label="Email Address"
										/>
									</div>

									<CustomFormField
										control={form.control}
										name="manager"
										type="text"
										component="input"
										placeholder="Enter manager name"
										label="Manager Name"
									/>

									<div className="flex justify-end gap-4">
										<Button type="button" variant="outline" onClick={() => form.reset()}>
											Reset
										</Button>
										<Button type="submit" className="gap-2">
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
