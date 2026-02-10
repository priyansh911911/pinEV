"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import { Card, CardContent } from "@/components/ui/card";
import * as StationActions from "@/actions/stations";
import * as TransactionActions from "@/actions/transactions";
import Stores from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { cpoAuth } from "@/functions/cpo-auth";

const AdminPage = () => {
	const router = useRouter();
	const { user } = Stores();
	const cpoUser = cpoAuth.getCurrentUser();
	const [isLoading, setIsLoading] = useState(true);
	const [statistics, setStatistics] = useState({
		totalStations: 0,
		activeStations: 0,
		totalTransactions: 0,
		revenue: 0,
		totalCredit: 0,
		totalDebit: 0,
	});

	const fetchDashboardData = useCallback(async () => {
		setIsLoading(true);
		try {
			// Fetch stations data
			const stationsRes = await StationActions.getStations({ search: `user:${user?.id}` });
			// Fetch transactions data
			const transactionsRes = await TransactionActions.getTransactions({ search: `station.user:${user?.id}` });

			if (!stationsRes.err) {
				const totalStations = stationsRes.count || 0;
				const activeStations = stationsRes.result.filter((station: any) => station.status === "approved").length || 0;

				setStatistics(prev => ({
					...prev,
					totalStations,
					activeStations,
				}));
			}

			if (!transactionsRes.err) {
				const transactions = transactionsRes.result || [];
				const totalTransactions = transactions.length;
				const revenue = transactions.reduce((sum: number, transaction: any) => sum + Number(transaction.amount || 0), 0);

				setStatistics(prev => ({
					...prev,
					totalTransactions,
					revenue,
				}));
			}

			// Fetch ALL transactions for global Credit/Debit stats (Admins see system-wide totals)
			const allTransactionsRes = await TransactionActions.getTransactions({ search: "" });
			if (!allTransactionsRes.err) {
				const allTransactions = allTransactionsRes.result || [];

				// Calculate Global Credit (Sum of 'credit' type rows using amount column)
				const totalCredit = allTransactions
					.filter((t: any) => t.type === "credit")
					.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

				// Calculate Global Debit (Sum of 'debit' type rows using amount column)
				const totalDebit = allTransactions
					.filter((t: any) => t.type === "debit")
					.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

				setStatistics(prev => ({
					...prev,
					totalCredit,
					totalDebit,
				}));
			}
		} catch (error) {
			console.error("Failed to fetch dashboard data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	useEffect(() => {
		fetchDashboardData();
	}, [fetchDashboardData]);

	return (
		<>
			<Header headerBackground="bg-background" back>
				<div className="flex flex-col">
					<h2 className="text-lg font-bold">Admin Dashboard</h2>
					<p className="text-sm text-muted-foreground">Manage your EV charging network</p>
				</div>
			</Header>
			<Layout>
				<div className="mt-[90px] pb-20">
					{/* Revenue Card */}
					<Card className="mb-6">
						<CardContent className="p-6">
							<div className="flex justify-between items-center mb-4">
								<h3 className="font-semibold">Total Revenue</h3>
							</div>
							<div className="flex items-center gap-2 mb-6">
								<Icons.IndianRupeeIcon className="w-6 h-6 text-primary" />
								<span className="text-3xl font-bold">
									{isLoading ? "..." : statistics.revenue.toLocaleString()}
								</span>
							</div>

							<div className="grid grid-cols-2 gap-4 pt-4 border-t">
								<div>
									<p className="text-sm text-muted-foreground mb-1">Total Credit</p>
									<div className="flex items-center gap-1 text-green-600">
										<Icons.ArrowUpIcon className="w-4 h-4" />
										<span className="text-lg font-bold">
											₹ {isLoading ? "..." : statistics.totalCredit.toLocaleString()}
										</span>
									</div>
								</div>
								<div>
									<p className="text-sm text-muted-foreground mb-1">Total Debit</p>
									<div className="flex items-center gap-1 text-red-600">
										<Icons.ArrowDownIcon className="w-4 h-4" />
										<span className="text-lg font-bold">
											₹ {isLoading ? "..." : statistics.totalDebit.toLocaleString()}
										</span>
									</div>
								</div>
							</div>

						</CardContent>
					</Card>

					{/* Dashboard Overview Cards */}
					<div className="grid grid-cols-2 gap-4 mb-6">
						<StatCard
							title="Stations"
							value={statistics.totalStations.toString()}
							icon={<Icons.StoreIcon className="w-5 h-5" />}
							subtext={`${statistics.activeStations} Active`}
							isLoading={isLoading}
							onClick={() => router.push("/admin/stations")}
						/>

						<StatCard
							title="Transactions"
							value={statistics.totalTransactions.toString()}
							icon={<Icons.WalletIcon className="w-5 h-5" />}
							isLoading={isLoading}
							onClick={() => router.push("/admin/transactions")}
						/>
					</div>

					{/* Quick Actions */}
					<h3 className="font-semibold mb-3">Quick Actions</h3>
					<div className="grid grid-cols-1 gap-3 mb-6">
						<QuickActionCard
							title="Add New Station"
							description="Create a new charging station in the network"
							icon={<Icons.PlusIcon className="w-5 h-5" />}
							onClick={() => router.push("/admin/stations/add")}
						/>
						<QuickActionCard
							title="View Active Bookings"
							description="Check bookings that are currently active"
							icon={<Icons.CalendarIcon className="w-5 h-5" />}
							onClick={() => router.push("/admin/bookings")}
						/>
						<QuickActionCard
							title="User"
							description="Manage users"
							icon={<Icons.UserIcon className="w-5 h-5" />}
							onClick={() => router.push("/admin/users")}
						/>
						<QuickActionCard
							title="CPO Management"
							description="Manage charge point operators"
							icon={<Icons.StoreIcon className="w-5 h-5" />}
							onClick={() => router.push("/admin/cpo")}
						/>
					</div>

					{/* Activity Feed */}
					{/* <h3 className="font-semibold mb-3">Recent Activity</h3>
					<Card className="mb-6">
						<CardContent className="p-0">
							<ActivityItem
								title="New Station Added"
								description="Station #2573 was added in Delhi"
								time="2 hours ago"
								icon={<Icons.StoreIcon className="w-4 h-4" />}
							/>
							<ActivityItem
								title="Payment Received"
								description="₹450 received from user #8432"
								time="5 hours ago"
								icon={<Icons.IndianRupeeIcon className="w-4 h-4" />}
							/>
							<ActivityItem
								title="Station Maintenance"
								description="Station #1842 is under maintenance"
								time="Yesterday"
								icon={<Icons.AlertTriangleIcon className="w-4 h-4" />}
							/>
							<ActivityItem
								title="New User Registration"
								description="User #9532 registered"
								time="2 days ago"
								icon={<Icons.UserIcon className="w-4 h-4" />}
								isLast={true}
							/>
						</CardContent>
					</Card> */}
				</div>
			</Layout>
		</>
	);
};

// Stat Card Component
const StatCard = ({
	title,
	value,
	icon,
	subtext,
	isLoading,
	onClick,
}: {
	title: string;
	value: string;
	icon: React.ReactNode;
	subtext?: string;
	isLoading: boolean;
	onClick?: () => void;
}) => {
	return (
		<Card className="overflow-hidden" onClick={onClick}>
			<CardContent className="p-4">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
					<div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">{icon}</div>
				</div>
				<p className="text-2xl font-bold">{isLoading ? "..." : value}</p>
				<div className="flex items-center justify-between w-full">
					<p className="text-xs text-muted-foreground">{subtext || ""}</p>
					<Icons.ArrowLeftIcon className="w-4 h-4 rotate-180" />
				</div>
			</CardContent>
		</Card>
	);
};

// Quick Action Card Component
const QuickActionCard = ({
	title,
	description,
	icon,
	onClick,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
	onClick?: () => void;
}) => {
	return (
		<Card className="overflow-hidden" onClick={onClick}>
			<CardContent className="flex items-center justify-between p-4 cursor-pointer">
				<div>
					<h3 className="font-semibold">{title}</h3>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
				<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">{icon}</div>
			</CardContent>
		</Card>
	);
};

// Activity Item Component
const ActivityItem = ({
	title,
	description,
	time,
	icon,
	isLast = false,
}: {
	title: string;
	description: string;
	time: string;
	icon: React.ReactNode;
	isLast?: boolean;
}) => {
	return (
		<>
			<div className="flex items-start gap-3 p-4">
				<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
				<div className="flex-1">
					<h4 className="font-medium">{title}</h4>
					<p className="text-sm text-muted-foreground">{description}</p>
					<p className="text-xs text-muted-foreground mt-1">{time}</p>
				</div>
			</div>
			{!isLast && <div className="h-px bg-border mx-4" />}
		</>
	);
};

export default AdminPage;
