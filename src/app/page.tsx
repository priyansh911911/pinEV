"use client";

import { getTransactions } from "@/actions/transactions";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import Stores from "@/lib/stores";
import Image from "next/image";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

const SplashPage = () => {
	const router = useRouter();

	const { isLoggedin, isLoggedinLoading } = Stores();

	if (!isLoggedinLoading && isLoggedin) {
		redirect("/home");
	}

	return (
		<Layout fullWidth className="min-h-svh h-svh bg-gradient-to-b from-primary/30 via-background to-background">
			<div className="default-page-width py-6 h-full flex flex-col justify-end">
				{/* <div className="flex items-center justify-end">
					<Link href="/home" className="text-xl font-semibold">
						Skip
					</Link>
				</div> */}

				<div className="space-y-12 mb-20">
					<div className="flex items-center justify-end">
						<Image src="/assets/images/charger.svg" alt="pin-charger" width={300} height={300} className="w-1/2" />
					</div>

					<div className="space-y-4">
						<h1 className="text-3xl font-semibold">Charge Ahead with confidence</h1>

						<p className="text-lg">Explore a one-stop shop for Electric Vehicles Chargers and accessories.</p>
					</div>

					<div className="flex items-center gap-2">
						<div className="rounded-full h-1.5 w-7 bg-primary"></div>
						<div className="rounded-full h-1.5 w-1.5 bg-neutral-300"></div>
						<div className="rounded-full h-1.5 w-1.5 bg-neutral-300"></div>
					</div>

					{!isLoggedinLoading ? (
						<Link href="/login" className="block">
							<Button className="w-full rounded-full font-semibold" size="xl">
								Get Started
							</Button>
						</Link>
					) : null}
				</div>
			</div>
		</Layout>
	);
};

export default SplashPage;
