"use client";

import Header from "@/components/custom/header";
import Loader from "@/components/custom/loader";
import Transition from "@/components/custom/transition";
import { Icons } from "@/components/icons";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { generateID } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

const BookingSuccessPage = () => {
	return (
		<Suspense fallback={<Loader />}>
			<Component />
		</Suspense>
	);
};

export default BookingSuccessPage;

const Component = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const paymentId = searchParams.get("paymentId");

	const [otp, setOtp] = useState<string>("");

	useEffect(() => {
		const otp = generateID("9999");
		setOtp(otp);
	}, []);

	const handleStartCharge = async () => {
		const transactionId = generateID("Xxx99xxX");

		// const response = await fetch("http://localhost:9000/api/charge", {
		// 	method: "POST",
		// 	headers: {
		// 		"Content-Type": "application/json",
		// 	},
		// 	body: JSON.stringify({
		// 		deviceId: "1234567890",
		// 		command: "RemoteStartTransaction",
		// 		payload: {
		// 			connectorId: 1,
		// 			transactionId: transactionId,
		// 			idTag: "user1",
		// 		},
		// 	}),
		// });

		// const data = await response.json();

		// if (data.err) {
		// 	toast.error(data.result);
		// 	return;
		// }

		router.replace(`/charge?txnid=${transactionId}`);
	};

	return (
		<Transition>
			<Header
				left={
					<Button onClick={() => router.back()} variant="link" className="p-0 m-0 text-background">
						<Icons.ArrowLeftIcon />
					</Button>
				}
				// right={
				// 	<Button variant="link" size="icon" className="p-0 m-0 text-background">
				// 		<Icons.ThreeDotIcon />
				// 	</Button>
				// }
			/>

			<Layout fullWidth className="flex flex-col h-svh">
				<div className="py-5 bg-gradient-to-br from-primary/80 to-primary rounded-b-3xl shadow-lg">
					<div className="default-page-width mt-8 flex flex-col items-center gap-8 text-background">
						<Image src="/assets/icons/success.svg" alt="success" width={100} height={100} />

						<h1 className="text-2xl font-bold">Payment Successfull</h1>
						<p className="text-lg font-semibold">Payment ID: #{paymentId}</p>
					</div>

					<div className="h-8"></div>
				</div>

				<div className="default-page-width h-full flex flex-col gap-4 items-center justify-center space-y-8">
					<Image src="/assets/icons/connector-fade.svg" alt="connector" width={150} height={150} />

					<p className="text-center text-neutral-500">
						Kindly connect the charger plug and enter below OTP in the charger display
					</p>

					<div className="flex items-center gap-4">
						{otp.split("").map((char, i) => (
							<div
								key={i}
								className="flex items-center justify-center p-4 size-16 rounded-xl text-xl font-bold bg-neutral-100"
							>
								{char}
							</div>
						))}
					</div>

					<Button onClick={() => setOtp(generateID("9999"))} variant="link" size="xl">
						Re-generate OTP?
					</Button>

					<Button onClick={handleStartCharge} className="w-full rounded-3xl" size="xl">
						Start Charging
					</Button>

					<div className="h-8"></div>
				</div>
			</Layout>
		</Transition>
	);
};
