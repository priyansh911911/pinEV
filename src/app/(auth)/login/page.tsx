"use client";

import CustomFormField, { CustomFormFieldProps } from "@/components/custom/form-field";
import Layout from "@/components/layout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormEvent, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { CustomFormValidation } from "@/lib/validations";
import { Form } from "@/components/ui/form";
import { Icons } from "@/components/icons";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { getUsers, loginUser } from "@/actions/users";
import Stores from "@/lib/stores";
import { toast } from "sonner";
import { generateID, cn } from "@/lib/utils";
import { getOTPEmailTemplate, sendEmail } from "@/lib/email";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OTP_LENGTH, TEST_EMAILS } from "@/lib/defaults";
import { sendOtp } from "@/functions/auth";
import OtpMethodSelector from "@/components/custom/otp-method-selector";

const PhoneInputForm: CustomFormFieldProps[] = [
	{
		validation: {
			type: { value: "string", message: "Email is required" },
			min: { value: 2, message: "Email is required" },
			optional: false,
		},
		name: "email",
		type: "email",
		component: "input",
		placeholder: "Email",
		leftIcon: <Icons.MailIcon className="text-primary" />,
	},
];

const LoginPage = () => {
	const router = useRouter();

	const { setUser, setSession, setIsLoggedin } = Stores();

	// States for managing the flow
	const [showOtpField, setShowOtpField] = useState<boolean>(false);
	const [showMethodSelector, setShowMethodSelector] = useState<boolean>(false);
	const [otp, setOtp] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [loginDetails, setLoginDetails] = useState<LoginDetails | null>(null);
	const [otpMethod, setOtpMethod] = useState<"email" | "sms" | null>(null);

	const validation = CustomFormValidation(PhoneInputForm);
	const form = useForm<z.infer<typeof validation>>({
		resolver: zodResolver(validation),
		defaultValues: {
			email: "",
		},
	});

	async function handleGetUserByEmail(email: string) {
		try {
			const userRes = await getUsers({
				search: `email:${email}`,
			});

			if (userRes?.err) {
				toast.error("Error while fetching user");
				// setError("Error while fetching user");

				return false;
			}

			if (!userRes?.count) {
				toast.error("User doesn't exist");
				// setError("User doesn't exist. Please contact Manager");

				return false;
			}

			const user = userRes?.result[0];

			return user;
		} catch (error) {
			toast.error("Error while fetching user");
			// setError("Error while fetching user");
			return false;
		}
	}

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
			const isTestEmail = TEST_EMAILS.includes((loginDetails?.email || "").toLowerCase());
			if (isTestEmail) {
				return true;
			}

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

	async function onSubmit(data: any) {
		const user = await handleGetUserByEmail(data.email);

		if (!user) return;

		const loginDetailsData = {
			id: user?.id,
			phone: user?.phone,
			email: user?.email,
			password: user?.password,
			is_active: user?.is_active,
			otp: "",
		};

		setLoginDetails(loginDetailsData);

		// Skip method selector, go directly to email OTP
		const otp = generateID("9999");
		const isTestEmail = TEST_EMAILS.includes((user?.email || "").toLowerCase());

		if (!isTestEmail) {
			const htmlPart = getOTPEmailTemplate(otp);
			await sendEmail({
				sendTo: [{ name: user?.email, email: user?.email }],
				subject: "PIN EV - OTP Verification",
				htmlPart: htmlPart,
			}).catch(err => {
				toast.error("Error while sending OTP email");
				return;
			});
		}

		setLoginDetails(prev => prev ? { ...prev, otp } : { ...loginDetailsData, otp });
		setShowOtpField(true);
	}

	async function handleOtpMethodSelect(method: "email" | "sms") {
		setOtpMethod(method);
		setShowMethodSelector(false);
		
		if (!loginDetails) return;

		const otp = generateID("9999");
		const isTestEmail = TEST_EMAILS.includes((loginDetails?.email || "").toLowerCase());

		if (method === "email" && !isTestEmail) {
			const htmlPart = getOTPEmailTemplate(otp);
			await sendEmail({
				sendTo: [{ name: loginDetails?.email, email: loginDetails?.email }],
				subject: "PIN EV - OTP Verification",
				htmlPart: htmlPart,
			}).catch(err => {
				toast.error("Error while sending OTP email");
				console.error("Error while sending OTP email", err);
				return;
			});
		} else if (method === "sms" && loginDetails?.phone) {
			sendOtp(loginDetails.phone, "login", (err: boolean, result: any) => {
				if (err) {
					toast.error("Error while sending SMS OTP");
					return;
				}
				toast.success("OTP sent to your phone");
			});
		}

		setLoginDetails(prev => prev ? { ...prev, otp } : null);
		setShowOtpField(true);
	}

	async function onOtpSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		if (!loginDetails) {
			console.log("No login details found, redirecting to login page");
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
		<Layout fullWidth className="min-h-svh h-svh bg-gradient-to-b from-background via-background to-primary/30">
			<div className="default-page-width py-12">
				<div onClick={() => router.back()} className="text-xl font-semibold">
					<Icons.ArrowLeftIcon />
				</div>

				<div className="flex flex-col mt-20">
					<div className="mb-20">
						<Image src="/assets/images/logo-name.svg" alt="pin-logo" width={300} height={300} className="w-1/3" />
					</div>

					{!showOtpField && !showMethodSelector ? (
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
								<Label className="text-xl">Enter your email</Label>
								{PhoneInputForm.map(item => (
									<CustomFormField key={item.name} {...item} />
								))}

								<div className="space-y-4">
									<Button
										disabled={form.getValues().email === ""}
										isLoading={form.formState.isSubmitting}
										className="w-full rounded-full font-semibold"
										size="xl"
									>
										Get Started
									</Button>

									<p className="text-sm">By continuing, I accept Terms of the service & Privacy policy</p>
								</div>
							</form>
						</Form>
					) : showMethodSelector ? (
						<div className="space-y-6">
							<OtpMethodSelector
								onMethodSelect={handleOtpMethodSelect}
								userEmail={loginDetails?.email}
								userPhone={loginDetails?.phone}
							/>
							<Button
								variant="outline"
								onClick={() => {
									setShowMethodSelector(false);
									setLoginDetails(null);
								}}
								className="w-full"
							>
								Back
							</Button>
						</div>
					) : (
						<form onSubmit={onOtpSubmit} className="space-y-10">
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
					)}

					{!showOtpField && !showMethodSelector && (
						<div className="flex items-center justify-between w-full">
							<p className="text-sm">Don&apos;t have an account? </p>
							<Link href="/signup">
								<Button variant="link">Sign up</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</Layout>
	);
};

export default LoginPage;
