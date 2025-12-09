"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUsers, loginUser } from "@/actions/users";
import Stores from "@/lib/stores";
import { toast } from "sonner";
import { sendOtp } from "@/functions/auth";

const MobileLoginPage = () => {
	const router = useRouter();

	const [phone, setPhone] = useState<string>("");
	const [showOtpField, setShowOtpField] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [loginDetails, setLoginDetails] = useState<LoginDetails | null>(null);

	const { setUser, setSession, setIsLoggedin } = Stores();

	async function handleGetUserByPhone(phone: string) {
		try {
			const userRes = await getUsers({
				search: `phone:${phone}`,
			});

			if (userRes?.err) {
				toast.error("Error while fetching user");
				return false;
			}

			if (!userRes?.count) {
				toast.error("User doesn't exist with this phone number");
				return false;
			}

			const user = userRes?.result[0];
			return user;
		} catch (error) {
			toast.error("Error while fetching user");
			return false;
		}
	}

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsLoading(true);

		const user = await handleGetUserByPhone(phone);

		if (!user) {
			setIsLoading(false);
			return;
		}

		// Send SMS OTP
		sendOtp(phone, "mobile-login", (err: boolean, result: any) => {
			setIsLoading(false);
			
			if (err) {
				toast.error("Error while sending SMS OTP");
				return;
			}

			setLoginDetails({
				id: user?.id,
				phone: user?.phone,
				email: user?.email,
				password: user?.password,
				is_active: user?.is_active,
				otp: result?.data, // Store OTP details from SMS service
			});

			setShowOtpField(true);
			toast.success("OTP sent to your phone");
		});
	}

	return (
		<Layout fullWidth className="min-h-svh h-svh bg-gradient-to-b from-background via-background to-primary/30">
			<div className="default-page-width py-12">
				<div onClick={() => router.back()} className="text-xl font-semibold">
					<Icons.ArrowLeftIcon />
				</div>

				<div className="flex flex-col mt-20">
					<div className="mb-20">
						<Image src="/assets/images/logo-name.svg" alt="pin-logo" width={300} height={300} className="w-1/3" />
					</div>

					{!showOtpField ? (
						<form onSubmit={onSubmit} className="space-y-10">
							<Label className="text-xl">Enter your mobile number</Label>
							
							<div className="relative">
								<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl font-semibold text-primary">
									+91
								</div>
								<Input
									type="tel"
									placeholder="Phone Number"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									className="pl-16 h-14 text-lg"
									required
								/>
							</div>

							<div className="space-y-4">
								<Button
									type="submit"
									disabled={phone.length < 10}
									isLoading={isLoading}
									className="w-full rounded-full font-semibold"
									size="xl"
								>
									Send OTP
								</Button>

								<p className="text-sm">By continuing, I accept Terms of the service & Privacy policy</p>
							</div>
						</form>
					) : (
						<div className="space-y-6">
							<div>
								<Label className="text-xl font-bold">
									Enter OTP sent to {phone}
								</Label>
								<p className="text-sm text-muted-foreground mt-2">
									We&apos;ve sent a 4-digit OTP to your mobile number
								</p>
							</div>

							<Button
								variant="outline"
								onClick={() => {
									setShowOtpField(false);
									setLoginDetails(null);
								}}
								className="w-full"
							>
								Change Number
							</Button>

							<Button
								variant="link"
								onClick={() => router.push("/login")}
								className="w-full"
							>
								Login with Email instead
							</Button>
						</div>
					)}
				</div>
			</div>
		</Layout>
	);
};

export default MobileLoginPage;