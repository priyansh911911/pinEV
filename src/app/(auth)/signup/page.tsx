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
import Stores from "@/lib/stores";
import { getUsers, loginUser, saveUser } from "@/actions/users";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OTP_LENGTH } from "@/lib/defaults";
import { cn, generateID } from "@/lib/utils";
import { verifyOtp } from "@/functions/auth";
import axios from "axios";
import { getOTPEmailTemplate, sendEmail } from "@/lib/email";
import { sendOtp } from "@/functions/auth";
import OtpMethodSelector from "@/components/custom/otp-method-selector";

const PhoneInputForm: CustomFormFieldProps[] = [
	{
		validation: {
			type: { value: "string", message: "Name is required" },
			min: { value: 2, message: "Name is required" },
			optional: false,
		},
		name: "name",
		type: "text",
		component: "input",
		placeholder: "Name",
		leftIcon: <Icons.UserIcon className="text-primary" />,
	},
	{
		validation: {
			type: { value: "string", message: "Phone number is required" },
			min: { value: 2, message: "Phone number is required" },
			optional: false,
		},
		name: "phone",
		type: "tel",
		component: "input",
		leftIcon: <h1 className="text-xl font-semibold text-primary">+91</h1>,
		placeholder: "Phone Number",
	},
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

const SignupPage = () => {
	const router = useRouter();

	const { setUser, setSession, setIsLoggedin } = Stores();

	// States for managing the flow
	const [showOtpField, setShowOtpField] = useState<boolean>(false);
	const [showMethodSelector, setShowMethodSelector] = useState<boolean>(false);
	const [otp, setOtp] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [otpMethod, setOtpMethod] = useState<"email" | "sms" | null>(null);
	const [signupDetails, setSignupDetails] = useState<{ name: string; email: string; phone: string; otp: string }>({
		name: "",
		email: "",
		phone: "",
		otp: "",
	});

	const validation = CustomFormValidation(PhoneInputForm);
	const form = useForm<z.infer<typeof validation>>({
		resolver: zodResolver(validation),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
		},
	});

	async function validateOTP(otp: string) {
		try {
			const isCorrect = otp === signupDetails?.otp;
			if (!isCorrect) {
				toast.error("Incorrect OTP");
				setError("Incorrect OTP! Please try again.");
				return false;
			}

			return true;
		} catch (err) {
			return false;
		}
	}

	const handleLogin = async (email: string, id: string) => {
		try {
			const body = { email: email, id: id };

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

	async function onSubmit(data: any) {
		const userRes = await getUsers({ search: `email:${data.email}` });

		if (userRes?.err) {
			toast.error("Error while fetching user");
			return;
		}

		if (userRes?.count) {
			toast.error("Email already exists!");
			return;
		}

		setSignupDetails({
			name: data?.name,
			email: data?.email,
			phone: data?.phone,
			otp: "",
		});

		// Show method selector for OTP delivery
		setShowMethodSelector(true);
	}

	async function handleOtpMethodSelect(method: "email" | "sms") {
		setOtpMethod(method);
		setShowMethodSelector(false);
		
		const otp = generateID("9999");

		if (method === "email") {
			const htmlPart = getOTPEmailTemplate(otp);
			await sendEmail({
				sendTo: [{ name: signupDetails?.name, email: signupDetails?.email }],
				subject: "PIN EV - OTP Verification",
				htmlPart: htmlPart,
			}).catch(err => {
				toast.error("Error while sending OTP email");
				console.error("Error while sending OTP email", err);
				return;
			});
		} else if (method === "sms" && signupDetails?.phone) {
			sendOtp(signupDetails.phone, "signup", (err: boolean, result: any) => {
				if (err) {
					toast.error("Error while sending SMS OTP");
					return;
				}
				toast.success("OTP sent to your phone");
			});
		}

		setSignupDetails(prev => ({ ...prev, otp }));
		setShowOtpField(true);
	}

	async function onOtpSubmit(e: FormEvent<HTMLFormElement>) {
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

			const res = await saveUser({ body: body });

			if (res.err) {
				toast.error("Error while creating user");
				setIsLoading(false);
				return;
			}

			const userId = res?.result?.lastInsertID;

			const loginData = await handleLogin(signupDetails?.email, userId);

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
			setSignupDetails({ email: "", name: "", phone: "", otp: "" });

			toast.success("Logged in successfully!");

			router.push("/home");
		} catch (error) {
			toast.error("Something went wrong! Please try again later.");
			setError("Something went wrong! Please try again later.");
		} finally {
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
								<Label className="text-xl">Enter your number</Label>
								{PhoneInputForm.map(item => (
									<CustomFormField key={item.name} {...item} />
								))}

								<div className="space-y-4">
									<Button
										disabled={form.getValues().phone === ""}
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
								userEmail={signupDetails?.email}
								userPhone={signupDetails?.phone}
							/>
							<Button
								variant="outline"
								onClick={() => {
									setShowMethodSelector(false);
									setSignupDetails({ name: "", email: "", phone: "", otp: "" });
								}}
								className="w-full"
							>
								Back
							</Button>
						</div>
					) : (
						<form onSubmit={onOtpSubmit} className="space-y-10">
							<div>
								<Label htmlFor="otp" className="text-dark font-bold text-xl">
									Enter the OTP
								</Label>

								<p className="text-dark font-semibold text-base">
									We sent an OTP to{" "}
									<span className="font-bold text-lg">
										{otpMethod === "email" ? signupDetails?.email : signupDetails?.phone}
									</span>
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
					)}

					{!showOtpField && !showMethodSelector && (
						<div className="flex items-center justify-between w-full">
							<p className="text-sm">Have an account? </p>
							<Link href="/login">
								<Button variant="link">Log in</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</Layout>
	);
};

export default SignupPage;
