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

// Simple hash function (matching signup)
const hashPassword = async (password: string): Promise<string> => {
	const encoder = new TextEncoder();
	const data = encoder.encode(password + "pinev_salt");
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(6, "Password must be at least 6 characters")
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
			password: ""
		}
	});

	const onSubmit = async (data: LoginFormData) => {
		setIsLoading(true);
		try {
			const hashedPassword = await hashPassword(data.password);
			const response = await Api.get("/users");

			console.log("Login response:", response);

			if (!response.err && response.result?.length > 0) {
				const user = response.result.find((u: any) => 
					u.email === data.email && 
					u.password === hashedPassword && 
					u.role === "cpo" && 
					u.is_active
				);
				
				if (user) {
					// Store authentication data
					localStorage.setItem("cpo_token", "authenticated");
					localStorage.setItem("cpo_user", JSON.stringify(user));
					
					toast.success("Login successful!");
					router.push("/cpo-portal/dashboard"); // Redirect to CPO dashboard
				} else {
					toast.error("Invalid credentials");
				}
			} else {
				toast.error("Invalid credentials");
			}
		} catch (error: any) {
			toast.error(error.response?.data?.message || "Login failed. Please try again.");
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
							Login to manage your charging stations
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
												placeholder="Enter your email here"
												disabled={isLoading}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input 
												type="password" 
												placeholder="Enter your password"
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
								{isLoading ? "Signing in..." : "Login as CPO"}
							</Button>
						</form>
					</Form>

					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							Don't have a CPO account?{" "}
							<Link href="/cpo-portal/signup" className="text-primary hover:underline">
								Sign up here
							</Link>
						</p>
					</div>
				</div>
			</Layout>
		</>
	);
};

export default CPOLoginPage;