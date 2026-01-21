"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Api from "@/apis/Api";
import { format, isAfter, isBefore, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from "date-fns";
import { sessionMonitor } from "@/services/session-monitor";

interface Station {
	id: number;
	name: string;
	address: string;
	code: string;
	status: string;
	price_per_kwh: number;
}

interface Transaction {
	id: number;
	final_amount: string;
	final_reading?: any;
	station: number;
	datetime: string;
	user: number;
	status?: string;
	duration_in_minute: number;
	started_at: string;
	stopped_at: string;
}

const CPOStatementsPage = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [stations, setStations] = useState<Station[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStation, setSelectedStation] = useState<string>("all");
	const [dateFilter, setDateFilter] = useState<string>("all");
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [isAutoCompleting, setIsAutoCompleting] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const loadStatementsData = async () => {
			try {
				const cpoEmail = localStorage.getItem("cpo_email");
				if (!cpoEmail) {
					router.push("/cpo-portal/login");
					return;
				}

				// Get stations assigned to this CPO
				const stationsResponse = await Api.get("/stations");
				const allStations = stationsResponse.result || [];
				const userStations = allStations.filter((station: any) => 
					station.assigned_email === cpoEmail
				);
				setStations(userStations);

				// Get users to find station relationships
				const usersResponse = await Api.get("/users");
				const allUsers = usersResponse.result || [];
				console.log('Sample users:', allUsers.slice(0, 3));

				// Get all charging sessions for CPO stations
				console.log('Fetching vehicles-chargings...');
				let allChargingSessions = [];
				try {
					const chargingResponse = await Api.get("/vehicles-chargings");
					console.log('Charging API Response:', chargingResponse);
					allChargingSessions = chargingResponse.result || chargingResponse.data || chargingResponse || [];
					console.log('All charging sessions:', allChargingSessions.length);
					console.log('Sample session:', allChargingSessions[0]);
				} catch (chargingError) {
					console.error('Error fetching vehicles-chargings:', chargingError);
					allChargingSessions = [];
				}

				const cpoTransactions = allChargingSessions.filter((session: any) => {
					const stationId = parseInt(session.station);
					return userStations.some((station: Station) => station.id === stationId);
				});
				console.log('CPO transactions:', cpoTransactions.length);

				setTransactions(cpoTransactions);
			} catch (error) {
				console.error("Error loading statements data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadStatementsData();
	}, [router]);

	const handleAutoComplete = async () => {
		setIsAutoCompleting(true);
		try {
			const result = await sessionMonitor.checkNow();
			if (result.completed > 0) {
				alert(`Auto-completed ${result.completed} sessions due to station failures`);
				window.location.reload();
			} else {
				alert('All sessions are healthy');
			}
		} catch (error) {
			alert('Failed to check sessions');
		} finally {
			setIsAutoCompleting(false);
		}
	};

	const filteredTransactions = transactions.filter(transaction => {
		const station = stations.find(s => s.id === transaction.station);
		const matchesSearch = !searchQuery || station?.name?.toLowerCase().includes(searchQuery.toLowerCase());
		
		const matchesStation = selectedStation === "all" || 
			(transaction.station?.toString() === selectedStation);
		
		// Date filtering
		const transactionDate = new Date(transaction.datetime);
		let matchesDate = true;
		
		if (dateFilter === "daily") {
			const today = new Date();
			matchesDate = transactionDate >= startOfDay(today) && transactionDate <= endOfDay(today);
		} else if (dateFilter === "weekly") {
			const today = new Date();
			matchesDate = transactionDate >= startOfWeek(today) && transactionDate <= endOfWeek(today);
		} else if (dateFilter === "monthly") {
			const today = new Date();
			matchesDate = transactionDate >= startOfMonth(today) && transactionDate <= endOfMonth(today);
		} else if (dateFilter === "custom" && startDate && endDate) {
			const start = startOfDay(new Date(startDate));
			const end = endOfDay(new Date(endDate));
			matchesDate = transactionDate >= start && transactionDate <= end;
		}
		
		return matchesSearch && matchesStation && matchesDate;
	});

	const totalRevenue = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.final_amount || '0'), 0);
	const totalEnergy = filteredTransactions.reduce((sum, t) => {
		const voltage = parseFloat(String(t.final_reading?.voltage || 0));
		const current = parseFloat(String(t.final_reading?.current || 0));
		const durationHours = parseFloat(String(t.duration_in_minute || 0)) / 60;
		const energyKWh = (voltage * current * durationHours) / 1000;
		return sum + energyKWh;
	}, 0);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Icons.LoadingIcon className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<>
			<Header left={
				<Link href="/cpo-portal/dashboard">
					<Button variant="ghost" size="icon">
						<Icons.ArrowLeftIcon className="h-4 w-4" />
					</Button>
				</Link>
			}>
				<h1 className="text-lg font-semibold">Station Statements</h1>
			</Header>

			<Layout className="pt-24 pb-10">
				<div className="space-y-6">
					{/* Auto-Complete Button */}
					<div className="flex justify-end">
						<Button 
							onClick={handleAutoComplete}
							disabled={isAutoCompleting}
							variant="outline"
						>
							{isAutoCompleting ? (
								<Icons.LoadingIcon className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Auto-Complete Failed Sessions
						</Button>
					</div>
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{filteredTransactions.length}</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Total Power</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalEnergy.toFixed(2)} kW</div>
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

					{/* Filters */}
					<div className="space-y-4">
						<Input
							type="text"
							placeholder="Search by customer name or station..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
						/>

						{/* Date Filter */}
						<div className="flex flex-wrap gap-4">
							<Tabs value={dateFilter} onValueChange={setDateFilter}>
								<TabsList>
									<TabsTrigger value="all">All Time</TabsTrigger>
									<TabsTrigger value="daily">Today</TabsTrigger>
									<TabsTrigger value="weekly">This Week</TabsTrigger>
									<TabsTrigger value="monthly">This Month</TabsTrigger>
									<TabsTrigger value="custom">Custom Range</TabsTrigger>
								</TabsList>
							</Tabs>
							
							{dateFilter === "custom" && (
								<div className="flex gap-2">
									<Input
										type="date"
										value={startDate}
										onChange={e => setStartDate(e.target.value)}
										placeholder="Start Date"
									/>
									<Input
										type="date"
										value={endDate}
										onChange={e => setEndDate(e.target.value)}
										placeholder="End Date"
									/>
								</div>
							)}
						</div>

						<Tabs defaultValue="all" onValueChange={setSelectedStation}>
							<TabsList className="w-full justify-start overflow-x-auto">
								<TabsTrigger value="all">All Stations</TabsTrigger>
								{stations.map(station => (
									<TabsTrigger key={station.id} value={station.id.toString()}>
										{station.name}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
					</div>

					{/* Transactions List */}
					<div className="space-y-4">
						<h2 className="text-xl font-semibold">Transaction History</h2>
						
						{filteredTransactions.length === 0 ? (
							<Card>
								<CardContent className="pt-6">
									<div className="text-center text-muted-foreground">
										<Icons.FileTextIcon className="h-12 w-12 mx-auto mb-4" />
										<p>No transactions found</p>
									</div>
								</CardContent>
							</Card>
						) : (
							filteredTransactions.map((transaction) => {
								const station = stations.find(s => s.id === transaction.station);
								return (
								<Card key={transaction.id}>
									<CardContent className="p-4">
										<div className="flex justify-between items-start mb-3">
											<div>
												<h3 className="font-semibold">{station?.name || 'Unknown Station'}</h3>
												<p className="text-sm text-muted-foreground">
													{station?.address} • Code: {station?.code}
												</p>
											</div>
											<Badge variant="default">
												completed
											</Badge>
										</div>

										<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
											<div>
												<p className="text-sm text-muted-foreground">Customer ID</p>
												<p className="font-medium">{transaction.user}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Power</p>
												<p className="font-medium">{parseFloat(transaction.final_reading?.power || '0').toFixed(2)} kW</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Amount</p>
												<p className="font-medium text-green-600">₹{parseFloat(transaction.final_amount || '0').toFixed(2)}</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Date & Time</p>
												<p className="font-medium">
													{format(new Date(transaction.datetime), "dd MMM yyyy, HH:mm")}
												</p>
											</div>
										</div>

										<div className="flex justify-between items-center pt-3 border-t">
											<div className="text-sm text-muted-foreground">
												Transaction ID: #{transaction.id}
											</div>
											<div className="text-sm">
												Rate: ₹{station?.price_per_kwh || 0}/kWh
											</div>
										</div>
									</CardContent>
								</Card>
								);
							})
						)}
					</div>
				</div>
			</Layout>
		</>
	);
};

export default CPOStatementsPage;