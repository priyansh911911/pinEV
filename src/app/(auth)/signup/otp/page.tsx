"use client";

import axios from "axios";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import Stores from "@/lib/stores";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import { loginUser } from "@/actions/users";
import { OTP_LENGTH } from "@/lib/defaults";
import { verifyOtp } from "@/functions/auth";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

const OTPPage = () => {
	const router = useRouter();

	const [otp, setOtp] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const { signupDetails, setSignupDetails, isSignupDetailsLoading, setUser, setSession, setIsLoggedin } = Stores();

	async function validateOTP(otp: string) {
		try {
			const { data } = await axios.post(`${process.env.NEXT_PUBLIC_VALIDATE_OTP_URL}`, { otp });

			if (data.err) {
				toast.error(data.message);
				setError(data.message);
				return false;
			}

			return true;
		} catch (err) {
			return false;
		}
	}

	const handleLogin = async (email: string, password: string) => {
		try {
			const body = { email: email, password: password };

			const res = await loginUser({ body });

			if (res?.err) {
				toast.error("Error while logging user");
				setError("Error while logging user");
				return null;
			} else {
				return { user: res?.result, session: res?.session };
			}
		} catch (error) {
			return null;
		}
	};

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		if (otp.length !== OTP_LENGTH) {
			toast.error("Invalid OTP!");
			setError("Invalid OTP! Please try again.");
			return;
		}

		setIsLoading(true);

		const otpValidated = await validateOTP(otp);
		if (!otpValidated) {
			setIsLoading(false);
			return;
		}

		try {
			const body = {
				name: signupDetails?.name,
				email: signupDetails?.email,
				phone: signupDetails?.phone,
				is_active: true,
				role: "User",
				last_login: new Date(),
			};

			const verifyOtpRes = await verifyOtp({
				otp: { otp: otp, otpDetails: 1 }, // TODO: send otp details instead of 1
				phone: signupDetails?.phone,
				body: JSON.stringify(body),
			});

			if (verifyOtpRes.err) {
				toast.error(verifyOtpRes?.result);
				setError(verifyOtpRes?.result);
				setIsLoading(false);
				return;
			}

			const loginData = await handleLogin(signupDetails?.email, verifyOtpRes?.result?.password);

			if (!loginData) {
				toast.error("Error while logging user");
				setError("Something went wrong! Please try again later.");
				setIsLoading(false);
				return;
			}

			const { user, session } = loginData;
			setUser(user);
			setSession(session);
			setIsLoggedin(true);
			setSignupDetails({ email: "", name: "", phone: "" });

			toast.success("OTP verified successfully!");

			//* redirect to home
			router.push("/home");
		} catch (error) {
			toast.error("Something went wrong! Please try again later.");
			setError("Something went wrong! Please try again later.");
		} finally {
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
						<div>
							<Label htmlFor="otp" className="text-dark font-bold text-xl">
								Enter the OTP
							</Label>

							<p className="text-dark font-semibold text-base">
								We sent an OTP to{" "}
								<span className="font-bold text-lg">{isSignupDetailsLoading ? "..." : signupDetails?.email}</span>
							</p>
						</div>

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
