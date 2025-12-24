"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import Layout from "@/components/layout";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OTP_LENGTH } from "@/lib/defaults";
import Api from "@/apis/Api";

const BackButton = () => (
	<Link href="/cpo-portal/login">
		<Button variant="ghost" size="icon">
			<Icons.ArrowLeftIcon className="h-4 w-4" />
		</Button>
	</Link>
);

const CPOOTPPage = () => {
	const [otp, setOtp] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const router = useRouter();

	// Get stored email and OTP from localStorage
	const storedEmail = typeof window !== "undefined" ? localStorage.getItem("cpo_temp_email") : null;
	const storedOtp = typeof window !== "undefined" ? localStorage.getItem("cpo_temp_otp") : null;

	const validateOTP = (inputOtp: string): boolean => {
		if (inputOtp === storedOtp) {
			return true;
		}
		setError("Incorrect OTP");
		toast.error("Incorrect OTP");
		return false;
	};

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError("");

		if (!storedEmail || !storedOtp) {
			toast.error("Session expired. Please try again.");
			router.push("/cpo-portal/login");
			return;
		}

		setIsLoading(true);

		try {
			const otpValidated = validateOTP(otp);
			if (!otpValidated) {
				setIsLoading(false);
				return;
			}

			// Check if email is assigned to any stations
			const stationsRes = await Api.get("/stations");
			const assignedStations = stationsRes.result?.filter((station: any) => 
				station.assigned_email === storedEmail
			);

			if (assignedStations && assignedStations.length > 0) {
				// Get CPO name from first station
				const cpoName = assignedStations[0].assigned_name || "CPO";
				
				// Create a simple user object for CPO
				const cpoUser = {
					id: storedEmail,
					email: storedEmail,
					name: cpoName,
					role: "cpo"
				};

				// Store authentication data
				localStorage.setItem("cpo_token", "authenticated");
				localStorage.setItem("cpo_user", JSON.stringify(cpoUser));
				localStorage.setItem("cpo_email", storedEmail);
				
				// Clear temporary data
				localStorage.removeItem("cpo_temp_email");
				localStorage.removeItem("cpo_temp_otp");
				
				toast.success(`Welcome ${cpoName}! Login successful!`);
				
				// Use window.location.href for hard redirect
				window.location.href = "/cpo-portal/dashboard";
			} else {
				toast.error("No stations assigned to this email");
			}
		} catch (error: any) {
			toast.error("Login failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (!storedEmail) {
		router.push("/cpo-portal/login");
		return null;
	}

	return (
		<>
			<Header left={<BackButton />}>
				<h1 className="text-lg font-semibold">CPO OTP Verification</h1>
			</Header>

			<Layout className="pt-24 pb-10">
				<div className="space-y-6">
					<div className="text-center">
						<h2 className="text-2xl font-bold">Verify Your Email</h2>
						<p className="text-muted-foreground mt-2">
							Enter the OTP sent to {storedEmail}
						</p>
					</div>

					<form onSubmit={onSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="otp" className="text-center block">
								Enter OTP
							</Label>
							<InputOTP 
								id="otp" 
								maxLength={OTP_LENGTH} 
								value={otp} 
								onChange={value => setOtp(value)}
							>
								<InputOTPGroup className="w-full flex items-center gap-2 justify-center">
									{Array.from({ length: OTP_LENGTH }).map((_, index) => (
										<InputOTPSlot
											key={index}
											className={cn(
												"text-2xl justify-center flex border border-neutral-300 rounded-lg size-16",
												{ "border-destructive": error }
											)}
											index={index}
										/>
									))}
								</InputOTPGroup>
							</InputOTP>
							{error && <p className="text-destructive text-sm text-center">{error}</p>}
						</div>

						<Button 
							type="submit" 
							className="w-full" 
							disabled={otp.length < OTP_LENGTH || isLoading}
						>
							{isLoading && (
								<Icons.LoadingIcon className="mr-2 h-4 w-4 animate-spin" />
							)}
							{isLoading ? "Verifying..." : "Verify & Login"}
						</Button>
					</form>

					<div className="text-center">
						<p className="text-sm text-muted-foreground">
							Didn't receive the code? Check your spam folder
						</p>
					</div>
				</div>
			</Layout>
		</>
	);
};

export default CPOOTPPage;