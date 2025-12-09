"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cpoAuth } from "@/functions/cpo-auth";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Api from "@/apis/Api";

interface Station {
	id: number;
	name: string;
	address: string;
	code: string;
	status: string;
	price_per_kwh: number;
	tax: number;
}

interface Transaction {
	id: number;
	amount_paid: number;
	power_consumed: number;
	station: Station;
	created_at: string;
}

interface StationStats {
	station: Station;
	totalEnergy: number;
	totalAmount: number;
	transactionCount: number;
}

const CPODashboard = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [stationStats, setStationStats] = useState<StationStats[]>([]);
	const router = useRouter();

	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				const user = cpoAuth.getCurrentUser();
				if (!user) {
					router.push("/cpo-portal/login");
					return;
				}

				// Get stations owned by this CPO
				const stationsResponse = await Api.get("/stations");
				const allStations = stationsResponse.result || [];
				const userStations = allStations.filter((station: any) => station.user === user.id);

				// Get transactions for all CPO stations
				const transactionsResponse = await Api.get("/transactions");
				const allTransactions = transactionsResponse.result || [];

				// Calculate stats for each station
				const stats: StationStats[] = userStations.map((station: Station) => {
					const stationTransactions = allTransactions.filter((t: any) => 
						t.station?.id === station.id || t.station === station.id
					);

					const totalEnergy = stationTransactions.reduce((sum: number, t: any) => 
						sum + (t.power_consumed || 0), 0
					);

					const totalAmount = stationTransactions.reduce((sum: number, t: any) => 
						sum + (t.amount_paid || 0), 0
					);

					return {
						station,
						totalEnergy,
						totalAmount,
						transactionCount: stationTransactions.length
					};
				});

				setStationStats(stats);
			} catch (error) {
				console.error("Error loading dashboard data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadDashboardData();
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Icons.LoadingIcon className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	const totalEnergy = stationStats.reduce((sum, stat) => sum + stat.totalEnergy, 0);
	const totalRevenue = stationStats.reduce((sum, stat) => sum + stat.totalAmount, 0);

	return (
		<>
			<Header left={
				<Link href="/profile">
					<Button variant="ghost" size="icon">
						<Icons.ArrowLeftIcon className="h-4 w-4" />
					</Button>
				</Link>
			}>
				<h1 className="text-lg font-semibold">CPO Dashboard</h1>
			</Header>

			<Layout className="pt-24 pb-10">
				<div className="space-y-6">
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Total Stations</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stationStats.length}</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Total Energy Supplied</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalEnergy.toFixed(2)} kWh</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
							</CardContent>
						</Card>
					</div>

					{/* Station Details */}
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Station Performance</h2>
						
						{stationStats.length === 0 ? (
							<Card>
								<CardContent className="pt-6">
									<div className="text-center text-muted-foreground">
										<Icons.StoreIcon className="h-12 w-12 mx-auto mb-4" />
										<p>No stations found for your account</p>
									</div>
								</CardContent>
							</Card>
						) : (
							stationStats.map((stat) => (
								<Card key={stat.station.id}>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="text-lg">{stat.station.name}</CardTitle>
												<p className="text-sm text-muted-foreground">
													{stat.station.address} • Code: {stat.station.code}
												</p>
											</div>
											<div className={`px-2 py-1 rounded text-xs font-medium ${
												stat.station.status === 'active' 
													? 'bg-green-100 text-green-800' 
													: 'bg-gray-100 text-gray-800'
											}`}>
												{stat.station.status}
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
											<div>
												<p className="text-sm text-muted-foreground">Energy Supplied</p>
												<p className="text-lg font-semibold">{stat.totalEnergy.toFixed(2)} kWh</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Revenue Earned</p>
												<p className="text-lg font-semibold">₹{stat.totalAmount.toFixed(2)}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Total Sessions</p>
												<p className="text-lg font-semibold">{stat.transactionCount}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Price per kWh</p>
												<p className="text-lg font-semibold">₹{stat.station.price_per_kwh || 0}</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</div>
			</Layout>
		</>
	);
};

export default CPODashboard;