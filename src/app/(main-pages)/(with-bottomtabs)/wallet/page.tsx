"use client";

import { toast } from "sonner";
import Stores from "@/lib/stores";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import FlatList from "@/components/flat-list";
import { Button } from "@/components/ui/button";
import Header from "@/components/custom/header";
import { Skeleton } from "@/components/ui/skeleton";
import Transition from "@/components/custom/transition";
import { getTransactions } from "@/actions/transactions";
import { useCallback, useEffect, useState } from "react";
import { createOrderForWalletLoad } from "@/lib/payments";
import RechargeDrawer from "@/components/custom/wallet/recharge.drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilterByTimeDrawer from "@/components/custom/wallet/filer-by-time.drawer";
import { endOfDay, format, isThisMonth, startOfDay, startOfMonth, subWeeks } from "date-fns";
import TransactionCard, { TransactionCardSkeleton } from "@/components/custom/wallet/transaction.card";
import Image from "next/image";

const calculateMonthlyTransactions = (transactions: Wallet[]) => {
	return transactions.reduce(
		(acc, transaction) => {
			if (isThisMonth(transaction.date)) {
				if (transaction.type === "credit") {
					acc.credits += Number(transaction.amount);
				} else {
					acc.debits += Math.abs(Number(transaction.amount));
				}
			}
			return acc;
		},
		{ credits: 0, debits: 0 }
	);
};

const calculateTotalSpent = (transactions: Wallet[]) => {
	return transactions.reduce((total, transaction) => {
		if (transaction.type === "debit") {
			return total + Math.abs(Number(transaction.amount));
		}
		return total;
	}, 0);
};

const WalletPage = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const returnTo = searchParams.get("returnTo") || "";

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [isFetching, setIsFetching] = useState<boolean>(false);
	const [totalBalance, setTotalBalance] = useState<number>(0);
	const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
	const [fields, setFields] = useState<{ amount: string; description: string }>({ amount: "", description: "" });
	const [activeTab, setActiveTab] = useState<string>("all");
	const [timeFilter, setTimeFilter] = useState<string>("all");
	const [transactions, setTransactions] = useState<Wallet[]>([]);
	const [monthlyStats, setMonthlyStats] = useState<{ credits: number; debits: number }>({ credits: 0, debits: 0 });
	const [totalSpent, setTotalSpent] = useState<number>(0);

	const { user, isUserLoading } = Stores();

	useEffect(() => {
		if (returnTo) {
			setIsRechargeModalOpen(true);
		}
	}, [returnTo]);

	async function handleRecharge(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setIsSubmitting(true);

		try {
			const newTransaction = {
				amount: Number(fields.amount),
				totalBalance: totalBalance + Number(fields.amount),
				description: fields.description || "Wallet Recharge",
			};

			await createOrderForWalletLoad({
				transaction: newTransaction,
				router,
				handleGetWallet: handleFetchTransaction,
				user,
			});

			setIsRechargeModalOpen(false);
			setFields({ amount: "", description: "" });

			toast.success("Recharge successful");

			if (returnTo) {
				router.replace(returnTo);
			}
		} catch (error) {
			toast.error("Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	}

	const getStartTime = (time: string) => {
		switch (time) {
			case "today":
				return startOfDay(new Date());
			case "week":
				return startOfDay(subWeeks(new Date(), 1));
			case "month":
				return startOfDay(startOfMonth(new Date()));
			default:
				return startOfDay(new Date());
		}
	};

	const handleFetchTransaction = useCallback(async () => {
		setIsFetching(true);

		setTransactions([]);

		try {
			const start = format(getStartTime(timeFilter), "yyyy-MM-dd'T'HH-mm-ss'Z'");
			const end = format(endOfDay(new Date()), "yyyy-MM-dd'T'HH-mm-ss'Z'");

			const date = timeFilter !== "all" ? `,date>:${start},date<:${end}` : "";
			const type = activeTab !== "all" ? `,type:${activeTab}` : "";
			const search = `user:${user.id}${type}${date}`;

			const res = await getTransactions({ search: search });

			if (res.err || !res.count) {
				return;
			}

			const allTransactions = res.result;

			setTransactions(allTransactions);

			const totalBalance = Number(allTransactions[0].total_balance) || 0;
			setTotalBalance(totalBalance);

			const monthlyTransactions = calculateMonthlyTransactions(allTransactions);
			setMonthlyStats(monthlyTransactions);
			const totalSpent = calculateTotalSpent(allTransactions);
			setTotalSpent(totalSpent);
		} catch (error) {
			console.log("error", error);
			toast.error("Something went wrong");
		} finally {
			setIsFetching(false);
		}
	}, [user, activeTab, timeFilter]);

	useEffect(() => {
		let script: any;
		const loadScript = (url: any) => {
			script = document.createElement("script");
			script.src = url;
			script.async = true;
			document.body.appendChild(script);
		};

		const scriptUrl = "https://checkout.razorpay.com/v1/checkout.js";
		loadScript(scriptUrl);

		// Cleanup function to remove the script when the component unmounts
		return () => {
			document.body.removeChild(script);
		};
	}, []);

	useEffect(() => {
		if (isUserLoading) {
			return;
		}

		handleFetchTransaction();
	}, [handleFetchTransaction, isUserLoading]);

	return (
		<>
			<Header
				right={
					<Button
						onClick={() => router.push("notifications")}
						variant="secondary"
						size="icon"
						className="rounded-full text-foreground"
					>
						<Icons.BellIcon />
					</Button>
				}
				headerBackground="bg-background shadow-sm"
			>
				<Image src="/assets/images/logo-name.svg" alt="pin-logo" width={100} height={100} className="w-20 h-auto" />
			</Header>

			<Layout className="py-24">
				{/* Main Wallet Card */}
				<Card className="mb-6">
					<CardContent className="p-6">
						<div className="flex items-center gap-4 justify-between">
							<div>
								<h3 className="text-sm text-muted-foreground">Total Balance</h3>
								{isFetching ? (
									<Skeleton className="h-8 w-32 mt-1" />
								) : (
									<p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
								)}
							</div>

							<Button
								className="rounded-full"
								leftIcon={<span className="text-primary-foreground font-semibold">₹</span>}
								onClick={() => setIsRechargeModalOpen(true)}
								size="lg"
							>
								Add Money
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Quick Stats */}
				<div className="grid grid-cols-2 gap-4 mb-6">
					<Card>
						<CardHeader className="p-4">
							<CardTitle className="text-sm text-muted-foreground">This Month</CardTitle>
							{isFetching ? (
								<Skeleton className="h-6 w-24" />
							) : (
								<div className="space-y-1">
									<p className="text-xl font-semibold text-success">+{formatCurrency(monthlyStats.credits)}</p>
									<p className="text-sm font-medium text-destructive">-{formatCurrency(monthlyStats.debits)}</p>
								</div>
							)}
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="p-4">
							<CardTitle className="text-sm text-muted-foreground">Total Spent</CardTitle>
							{isFetching ? (
								<Skeleton className="h-6 w-24" />
							) : (
								<p className="text-xl font-semibold text-destructive">-{formatCurrency(totalSpent)}</p>
							)}
						</CardHeader>
					</Card>
				</div>

				{/* Transactions Section */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="font-semibold text-lg">Transactions</h2>

						<FilterByTimeDrawer timeFilter={timeFilter} setTimeFilter={setTimeFilter} />
					</div>

					<Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="grid w-full grid-cols-3 mb-4">
							<TabsTrigger value="all">All</TabsTrigger>
							<TabsTrigger value="credit">Income</TabsTrigger>
							<TabsTrigger value="debit">Expense</TabsTrigger>
						</TabsList>

						<TabsContent value={activeTab}>
							{isFetching ? (
								<TransactionCardSkeleton count={6} />
							) : !isFetching && transactions.length ? (
								<div className="space-y-3">
									<FlatList
										data={transactions}
										renderItem={transaction => <TransactionCard transaction={transaction} />}
										keyExtractor={transaction => transaction.id}
									/>
								</div>
							) : !isFetching && transactions.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-10">
									<Icons.WalletIcon className="h-16 w-16 text-muted-foreground mb-4" />
									<p className="text-muted-foreground">No transactions found</p>
								</div>
							) : null}
						</TabsContent>
					</Tabs>
				</div>
			</Layout>

			<RechargeDrawer
				fields={fields}
				setFields={setFields}
				isRechargeModalOpen={isRechargeModalOpen}
				setIsRechargeModalOpen={setIsRechargeModalOpen}
				handleRecharge={handleRecharge}
				isSubmitting={isSubmitting}
			/>
		</>
	);
};

export default WalletPage;
