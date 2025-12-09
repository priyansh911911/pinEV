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

// Simple hash function (not as secure as bcrypt but better than plain text)
const hashPassword = async (password: string): Promise<string> => {
	const encoder = new TextEncoder();
	const data = encoder.encode(password + "pinev_salt");
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const signupSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Please enter a valid email address"),
	phone: z.string().min(10, "Phone number must be at least 10 digits"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const BackButton = () => (
	<Link href="/cpo-portal/login">
		<Button variant="ghost" size="icon">
			<Icons.ArrowLeftIcon className="h-4 w-4" />
		</Button>
	</Link>
);

const CPOSignupPage = () => {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const form = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			password: "",
			confirmPassword: ""
		}
	});

	const onSubmit = async (data: SignupFormData) => {
		setIsLoading(true);
		try {
			// Check if email already exists
			const existingUserResponse = await Api.get("/users");
			const existingUser = existingUserResponse.result?.find((u: any) => u.email === data.email);
			
			const hashedPassword = await hashPassword(data.password);
			
			let response;
			if (existingUser) {
				// Update existing user with CPO role and password
				response = await Api.put(`/users/${existingUser.id}`, {
					body: {
						name: data.name,
						phone: data.phone,
						password: hashedPassword,
						role: "cpo",
						is_active: true
					}
				});
			} else {
				// Create new user
				response = await Api.post("/users", {
					body: {
						name: data.name,
						email: data.email,
						phone: data.phone,
						password: hashedPassword,
						role: "cpo",
						is_active: true
					}
				});
			}

			if (!response.err && response.result?.rowsAffected > 0) {
				toast.success("Account created successfully! Please login.");
				router.push("/cpo-portal/login");
			} else {
				toast.error(response.message || "Signup failed");
			}
		} catch (error: any) {
			console.error("Signup error:", error);
			console.error("Error response:", error.response);
			toast.error(error.response?.data?.message || error.message || "Signup failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Header left={<BackButton />}>
				<h1 className="text-lg font-semibold">CPO Signup</h1>
			</Header>

			<Layout className="pt-24 pb-10">
				<div className="space-y-6">
					<div className="text-center">
						<h2 className="text-2xl font-bold">Join as CPO</h2>
						<p className="text-muted-foreground mt-2">
							Create your Charging Point Operator account
						</p>
					</div>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name</FormLabel>
										<FormControl>
											<Input 
												placeholder="Enter your full name"
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
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input 
												type="email" 
												placeholder="Enter your email"
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
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone Number</FormLabel>
										<FormControl>
											<Input 
												type="tel" 
												placeholder="Enter your phone number"
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
												placeholder="Create a password"
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
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<Input 
												type="password" 
												placeholder="Confirm your password"
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
								{isLoading ? "Creating Account..." : "Create CPO Account"}
							</Button>
						</form>
					</Form>

					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link href="/cpo-portal/login" className="text-primary hover:underline">
								Login here
							</Link>
						</p>
					</div>
				</div>
			</Layout>
		</>
	);
};

export default CPOSignupPage;