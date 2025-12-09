"use client";

import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as StationActions from "@/actions/stations";
import Api from "@/apis/Api";
import { toast } from "sonner";

interface StationData {
	id: number;
	name: string;
	address: string;
	code: string;
	status: string;
	price_per_kwh: number;
	powerUsage: number;
	totalCost: number;
	assignedName?: string;
	assignedPhone?: string;
}

const CPODashboard = () => {
	const [stations, setStations] = useState<StationData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editName, setEditName] = useState("");
	const [editPhone, setEditPhone] = useState("");

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const stationsRes = await StationActions.getStations({});
			const transactionsRes = await Api.get("/transactions");

			if (!stationsRes.err && !transactionsRes.err) {
				const allStations = stationsRes.result || [];
				const allTransactions = transactionsRes.result || [];

				const stationData: StationData[] = allStations
					.filter((station: any) => station.status === 'approved')
					.map((station: any) => {
					const stationTxns = allTransactions.filter(
						(t: any) => t.station?.id === station.id || t.station === station.id
					);

					const powerUsage = stationTxns.reduce(
						(sum: number, t: any) => sum + (t.power_consumed || 0),
						0
					);

					const totalCost = stationTxns.reduce(
						(sum: number, t: any) => sum + (t.amount_paid || 0),
						0
					);

					return {
						id: station.id,
						name: station.name,
						address: station.address,
						code: station.code,
						status: station.status,
						price_per_kwh: station.price_per_kwh || 0,
						powerUsage,
						totalCost,
						assignedName: station.assigned_name || "",
						assignedPhone: station.assigned_phone || "",
					};
				});

				setStations(stationData);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const totalPower = stations.reduce((sum, s) => sum + s.powerUsage, 0);
	const totalRevenue = stations.reduce((sum, s) => sum + s.totalCost, 0);

	const handleSaveAssignment = async (stationId: number) => {
		try {
			console.log("Saving assignment:", { stationId, assigned_name: editName, assigned_phone: editPhone });
			const result = await StationActions.updateStation({
				id: stationId.toString(),
				body: { assigned_name: editName, assigned_phone: editPhone },
			});
			console.log("Update result:", result);
			setStations(stations.map(s => s.id === stationId ? { ...s, assignedName: editName, assignedPhone: editPhone } : s));
			setEditingId(null);
			toast.success("Assignment saved");
		} catch (error) {
			console.error("Failed to save:", error);
			toast.error("Failed to save");
		}
	};

	return (
		<>
			<Header back headerBackground="bg-background">
				<h1 className="text-xl font-semibold">CPO Dashboard</h1>
			</Header>

			<Layout className="min-h-screen pb-10">
				<div className="h-24" />

				{isLoading ? (
					<div className="flex items-center justify-center h-[50vh]">
						<Icons.LoadingIcon className="h-8 w-8 animate-spin" />
					</div>
				) : (
					<div className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">Total Power Usage</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{totalPower.toFixed(2)} kWh</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">Total Revenue</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
								</CardContent>
							</Card>
						</div>

						<div className="space-y-4">
							<h2 className="text-lg font-semibold">All Stations</h2>
							{stations.map((station) => (
								<Card key={station.id}>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="text-lg">{station.name}</CardTitle>
												<p className="text-sm text-muted-foreground">{station.address}</p>
											</div>
											<div className={`px-2 py-1 rounded text-xs ${
												station.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
											}`}>
												{station.status}
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-2 gap-4 mb-4">
											<div>
												<p className="text-sm text-muted-foreground">Power Usage</p>
												<p className="text-lg font-semibold">{station.powerUsage.toFixed(2)} kWh</p>
											</div>
											<div>
												<p className="text-sm text-muted-foreground">Total Cost</p>
												<p className="text-lg font-semibold">₹{station.totalCost.toFixed(2)}</p>
											</div>
										</div>
										<div className="border-t pt-4">
											<p className="text-sm font-medium mb-2">Assigned To</p>
											{editingId === station.id ? (
												<div className="space-y-2">
													<Input placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
													<Input placeholder="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
													<div className="flex gap-2">
														<Button size="sm" onClick={() => handleSaveAssignment(station.id)}>Save</Button>
														<Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
													</div>
												</div>
											) : (
												<div className="flex justify-between items-start">
													<div>
														<p className="text-sm">{station.assignedName || "Not assigned"}</p>
														<p className="text-sm text-muted-foreground">{station.assignedPhone}</p>
													</div>
													<Button size="sm" variant="outline" onClick={() => {
														setEditingId(station.id);
														setEditName(station.assignedName || "");
														setEditPhone(station.assignedPhone || "");
													}}>Edit</Button>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{stations.length === 0 && (
							<div className="text-center py-10">
								<Icons.StoreIcon className="mx-auto h-10 w-10 text-muted-foreground" />
								<p className="mt-2 text-lg font-medium">No stations found</p>
							</div>
						)}
					</div>
				)}
			</Layout>
		</>
	);
};

export default CPODashboard;
