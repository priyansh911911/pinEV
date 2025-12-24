"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import Layout from "@/components/layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import Api from "@/apis/Api";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const BackButton = () => (
	<Link href="/profile">
		<Button variant="ghost" size="icon">
			<Icons.ArrowLeftIcon className="h-4 w-4" />
		</Button>
	</Link>
);

const CPOLoginPage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
		}
	});

	const onSubmit = async (data: LoginFormData) => {
		setIsLoading(true);
		try {
			// Check if email is assigned to any stations directly
			const stationsRes = await Api.get("/stations");
			const assignedStations = stationsRes.result?.filter((station: any) => 
				station.assigned_email === data.email
			);

			if (assignedStations && assignedStations.length > 0) {
				// Get CPO name from first station
				const cpoName = assignedStations[0].assigned_name || "CPO";
				
				// Create a simple user object for CPO
				const cpoUser = {
					id: data.email,
					email: data.email,
					name: cpoName,
					role: "cpo"
				};

				// Store authentication data
				localStorage.setItem("cpo_token", "authenticated");
				localStorage.setItem("cpo_user", JSON.stringify(cpoUser));
				localStorage.setItem("cpo_email", data.email);
				
				toast.success(`Welcome ${cpoName}! Login successful!`);
				router.push("/cpo-portal/dashboard");
			} else {
				toast.error("No stations assigned to this email");
			}
		} catch (error: any) {
			toast.error("Login failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Header left={<BackButton />}>
				<h1 className="text-lg font-semibold">CPO Login</h1>
			</Header>

			<Layout className="pt-24 pb-10">
				<div className="space-y-6">
					<div className="text-center">
						<h2 className="text-2xl font-bold">Charging Point Operator</h2>
						<p className="text-muted-foreground mt-2">
							Enter your assigned email to access your stations
						</p>
					</div>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input 
												type="email" 
												placeholder="Enter your assigned email"
												disabled={isLoading}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading && (
									<Icons.LoadingIcon className="mr-2 h-4 w-4 animate-spin" />
								)}
								{isLoading ? "Checking..." : "Login as CPO"}
							</Button>
						</form>
					</Form>

					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							Contact admin if you need stations assigned to your email
						</p>
					</div>
				</div>
			</Layout>
		</>
	);
};

export default CPOLoginPage;