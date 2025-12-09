"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { OTP_LENGTH } from "@/lib/defaults";
import Stores from "@/lib/stores";
import { verifyOtp } from "@/functions/auth";
import { getUsers, loginUser } from "@/actions/users";
import axios from "axios";
import { toast } from "sonner";

const OTPPage = () => {
	const router = useRouter();

	const [otp, setOtp] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const { loginDetails, setLoginDetails, setUser, setSession, setIsLoggedin } = Stores();

	useEffect(() => {
		console.log("loginDetails", loginDetails);
	}, [loginDetails]);

	async function checkAndLoginUser(loginDetails: LoginDetails) {
		try {
			const isAccountActive = !!loginDetails?.is_active;
			if (!isAccountActive) {
				toast.error("Account is inactive. Please contact Manager");
				setError("Account is inactive. Please contact Manager");

				router.push("/login");
				return;
			}

			const body = { id: loginDetails?.id, email: loginDetails?.email };

			const res = await loginUser({ body });

			if (res?.err) {
				toast.error("Error while logging user");
				setError("Error while logging user");
			} else {
				setUser(res?.result);
				setSession(res?.session);

				setIsLoggedin(true);
				setLoginDetails(null);
				toast.success("Login Successful!");

				router.push("/home");
			}
		} catch (error) {
			toast.error("Error while verifying OTP");
			setError("Error while verifying OTP");
		}
	}

	async function validateOTP(otp: string) {
		try {
			const isCorrect = otp === loginDetails?.otp;
			if (!isCorrect) {
				toast.error("Incorrect OTP");
				setError("Incorrect OTP");
				return false;
			}

			return true;
		} catch (err) {
			return false;
		}
	}

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		console.log("loginDetails", loginDetails);

		if (!loginDetails) {
			console.log("No login details found, redirecting to login page");

			// router.replace("/login");
			return;
		}

		setIsLoading(true);

		const otpValidated = await validateOTP(otp);

		if (!otpValidated) {
			setIsLoading(false);
			return;
		}

		try {
			await checkAndLoginUser(loginDetails);
			setIsLoading(false);
		} catch (error) {
			toast.error("Error while verifying OTP!");
			setError("Error while verifying OTP!");
			setIsLoading(false);
		}
	}

	return (
		<Layout fullWidth className="min-h-svh h-svh bg-gradient-to-b from-background via-backfrom-background to-primary/30">
			<div className="default-page-width py-12">
				<div onClick={() => router.back()} className="text-xl font-semibold">
					<Icons.ArrowLeftIcon />
				</div>

				<div className="flex flex-col gap-y-20 mt-20">
					<div>
						<Image src="/assets/images/logo-name.svg" alt="pin-logo" width={300} height={300} className="w-1/3" />
					</div>

					<form onSubmit={onSubmit} className="space-y-10">
						<Label htmlFor="otp" className="text-dark font-bold text-xl">
							Enter the OTP
						</Label>

						<div className="space-y-2">
							<InputOTP id="otp" maxLength={OTP_LENGTH} value={otp} onChange={value => setOtp(value)}>
								<InputOTPGroup className="w-full flex items-center gap-2 justify-center">
									{Array.from({ length: OTP_LENGTH }).map((_, index) => (
										<InputOTPSlot
											key={index}
											className={cn(
												"text-2xl justify-center flex border border-neutral-300 rounded-lg size-16 gap-4",
												{ "border-destructive": error }
											)}
											index={index}
										/>
									))}
								</InputOTPGroup>
							</InputOTP>

							<p className="text-destructive text-sm">{error}</p>
						</div>

						<Button
							type="submit"
							disabled={otp.length < OTP_LENGTH}
							isLoading={isLoading}
							className="w-full rounded-full font-semibold"
							size="xl"
						>
							Verify OTP
						</Button>
					</form>
				</div>
			</div>
		</Layout>
	);
};

export default OTPPage;
