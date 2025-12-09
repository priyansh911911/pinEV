"use client";
import { getTransactions, saveTransaction } from "@/actions/transactions";
import Header from "@/components/custom/header";
import { Icons } from "@/components/icons";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import Stores from "@/lib/stores";
import { cn, formatCurrency, generateID } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
// import { chargeImg } from "./charge.png";

const pricePerKwh = 18; // Price per kWh

const ChargeDetails = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const stationId = searchParams.get("id");
	const bookingId = searchParams.get("bookingId");

	const [showBillDetails, setShowBillDetails] = useState<boolean>(false);
	const [kwh, setKwh] = useState<number>(5);
	const [price, setPrice] = useState<{ amount: number; tax: number; total: number }>({ amount: 0, tax: 0, total: 0 });
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [walletBalance, setWalletBalance] = useState<number>(0);

	const { user } = Stores();

	useEffect(() => {
		const amount = kwh * pricePerKwh;
		const tax = amount * 0.18; //* 18% tax
		const total = amount + tax;

		setPrice({ amount, tax, total });
	}, [kwh]);

	const handleSetKwh = (value: number) => {
		setKwh(value);
	};

	const handleGetWallet = useCallback(async () => {
		if (!user) return;

		try {
			const transactionRes = await getTransactions({ 
				search: `user:${user.id}`, 
				page: "1,10",
				sort: "created_at:desc"
			});

			if (transactionRes.err) {
				toast.error("Cannot fetch wallet balance");
				return;
			}

			if (transactionRes.count === 0) {
				setWalletBalance(0);
				return;
			}

			// Get the most recent transaction's balance
			const latestTransaction = transactionRes.result[0];
			setWalletBalance(latestTransaction.total_balance || 0);
			console.log('Wallet balance fetched:', latestTransaction.total_balance);
		} catch (error) {
			console.error("Error fetching wallet balance:", error);
			toast.error("Something went wrong while fetching wallet balance");
		}
	}, [user]);

	useEffect(() => {
		handleGetWallet();
	}, [handleGetWallet]);

	const handlePayment = async () => {
		setIsLoading(true);

		try {
			if (walletBalance < price.total) {
				toast.error("You don't have enough balance to make this payment");
				return;
			}

			const walletBody = {
				user: user.id,
				amount: price.total,
				total_balance: walletBalance - price.total,
				date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
				description: "Charge Payment",
				type: "debit",
			};

			const res = await saveTransaction({ body: walletBody });

			if (res.err) {
				toast.error("Cannot save transaction");
				return;
			}

			router.push(`/booking/payment/success?paymentId=${res.result.lastInsertID}`);
		} catch (error) {
			console.log("error", error);
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Header
				left={
					<Button onClick={() => router.back()} variant="link" className="p-0 m-0">
						<Icons.ArrowLeftIcon className="text-foreground" />
					</Button>
				}
				// right={
				// 	<Button variant="secondary" size="icon" className="rounded-full text-foreground">
				// 		<Icons.ThreeDotIcon />
				// 	</Button>
				// }
				headerBackground="bg-background"
			>
				<h1 className="line-clamp-1 text-lg font-semibold pr-10">Charge Details</h1>
			</Header>

			<Layout className="h-svh mb-10">
				<div className="h-20"></div>

				<div className="pb-6">
					<p className="text-gray-600 text-md text-center px-14">Sangeetha Mobiles Gharepalya EV Charger</p>
					<Image src="/assets/images/charge.png" alt="charge" width={100} height={100} className="w-64 mt-4 mx-auto" />
					<div className="flex justify-between items-center text-sm mt-2">
						<div>
							<p className="text-gray-600 font-semibold">#123456</p>
							<p className="text-black font-semibold">Slot 1</p>
						</div>
						<div className="rounded-full bg-green-100 w-24 h-8 flex justify-center items-center">
							<p>{formatCurrency(pricePerKwh, 0)} / kWh</p>
						</div>
					</div>
				</div>

				<Separator />

				<div className="mt-10 pb-8">
					<h2>Choose your preferred energy amount</h2>

					<div className="space-y-4">
						<div className="flex justify-between text-sm">
							<span>
								{kwh} kWh
							</span>
							<span className="text-muted-foreground">{formatCurrency(kwh * pricePerKwh)}</span>
						</div>
						<Slider
							min={1}
							max={50}
							step={1}
							value={[kwh]}
							onValueChange={value => handleSetKwh(value[0])}
							className="my-4"
						/>
						<div className="flex flex-wrap gap-2">
							{[5, 10, 15, 20, 25, 30].map(energy => (
								<Button
									key={energy}
									type="button"
									variant={energy === kwh ? "default" : "outline"}
									className="px-4"
									onClick={() => handleSetKwh(energy)}
								>
									{energy} kWh
								</Button>
							))}
						</div>
					</div>
				</div>

				<Separator />

				<div className="h-8"></div>

				<div onClick={() => setShowBillDetails(!showBillDetails)} className="flex justify-between">
					<p className="font-bold text-md">Bill Details</p>
					<p className="bg-green-100 rounded-full py-1 px-3 flex gap-2 cursor-pointer">
						{formatCurrency(price.total)}
						<Icons.ChevronRightIcon
							className={cn("-rotate-90 w-4 h-auto transition-transform duration-300", {
								"rotate-90": showBillDetails,
							})}
						/>
					</p>
				</div>

				<div
					className={cn("mt-4 space-y-4 scale-y-0 transition-transform duration-300 origin-top", {
						"scale-y-100 origin-top": showBillDetails,
					})}
				>
					<div className="flex justify-between">
						<p className="font-semibold text-neutral-500 text-md">Energy Amount</p>
						<p className="font-semibold text-base">{kwh} kWh</p>
					</div>
					<div className="flex justify-between">
						<p className="font-semibold text-neutral-500 text-md">Charge Rate</p>
						<p className="font-semibold text-base">{formatCurrency(price.amount)}</p>
					</div>
					<div className="flex justify-between">
						<p className="font-semibold text-neutral-500 text-md">Tax</p>
						<p className="font-semibold text-base">{formatCurrency(price.tax)}</p>
					</div>
					<div className="flex justify-between pt-4 pb-10 border-t border-neutral-500">
						<p className="font-semibold text-neutral-500 text-md">Total</p>
						<p className="font-semibold text-green-500 text-base">{formatCurrency(price.total)}</p>
					</div>
				</div>
			</Layout>

			<div className="sticky bottom-0 left-0 w-full bg-background rounded-t-xl shadow-[0_0_10px_rgba(0,0,0,0.25)]">
				<div className="default-page-width py-6">
					<Button onClick={handlePayment} className="w-full rounded-3xl" size="xl">
						Continue to Pay {formatCurrency(price.total)}
					</Button>
				</div>
			</div>
		</>
	);
};

export default ChargeDetails;
