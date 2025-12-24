"use client";

import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
	assignedEmail?: string;
}

interface CPOData {
	id: number;
	name: string;
	phone: string;
	email?: string;
	company?: string;
	stations: StationData[];
	totalRevenue: number;
	totalPowerUsage: number;
	status: "active" | "inactive";
}

const CPODashboard = () => {
	const [stations, setStations] = useState<StationData[]>([]);
	const [cpoProfiles, setCpoProfiles] = useState<CPOData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [viewMode, setViewMode] = useState<"stations" | "cpo">("cpo");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editName, setEditName] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [existingCPOs, setExistingCPOs] = useState<{email: string, name: string, phone: string}[]>([]);

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
						assignedEmail: station.assigned_email || "",
					};
				});

				setStations(stationData);
				generateCPOProfiles(stationData);
				
				// Extract unique CPOs for dropdown
				const uniqueCPOs = Array.from(
					new Map(
						stationData
							.filter(s => s.assignedEmail)
							.map(s => [s.assignedEmail, { email: s.assignedEmail!, name: s.assignedName!, phone: s.assignedPhone! }])
					).values()
				);
				setExistingCPOs(uniqueCPOs);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const generateCPOProfiles = (stationData: StationData[]) => {
		const cpoMap = new Map<string, CPOData>();

		stationData.forEach(station => {
			if (station.assignedName && station.assignedPhone) {
				const key = `${station.assignedName}-${station.assignedPhone}`;
				
				if (cpoMap.has(key)) {
					const existing = cpoMap.get(key)!;
					existing.stations.push(station);
					existing.totalRevenue += station.totalCost;
					existing.totalPowerUsage += station.powerUsage;
				} else {
					cpoMap.set(key, {
						id: station.id,
						name: station.assignedName,
						phone: station.assignedPhone,
						stations: [station],
						totalRevenue: station.totalCost,
						totalPowerUsage: station.powerUsage,
						status: "active"
					});
				}
			}
		});

		setCpoProfiles(Array.from(cpoMap.values()));
	};

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const totalPower = stations.reduce((sum, s) => sum + s.powerUsage, 0);
	const totalRevenue = stations.reduce((sum, s) => sum + s.totalCost, 0);

	const handleSaveAssignment = async (stationId: number) => {
		if (!editEmail || !editName) {
			toast.error("Email and Name are required");
			return;
		}
		try {
			const result = await StationActions.updateStation({
				id: stationId.toString(),
				body: { assigned_name: editName, assigned_phone: editPhone, assigned_email: editEmail },
			});
			setStations(stations.map(s => s.id === stationId ? { ...s, assignedName: editName, assignedPhone: editPhone, assignedEmail: editEmail } : s));
			setEditingId(null);
			toast.success("Assignment saved");
			fetchData();
		} catch (error) {
			console.error("Failed to save:", error);
			toast.error("Failed to save");
		}
	};

	const handleSelectExistingCPO = (cpoEmail: string) => {
		const cpo = existingCPOs.find(c => c.email === cpoEmail);
		if (cpo) {
			setEditEmail(cpo.email);
			setEditName(cpo.name);
			setEditPhone(cpo.phone);
		}
	};

	return (
		<>
			<Header back headerBackground="bg-background">
				<h1 className="text-xl font-semibold">CPO Management</h1>
			</Header>

			<Layout className="min-h-screen pb-10">
				<div className="h-24" />

				<div className="flex gap-2 mb-6">
					<Button 
						variant={viewMode === "cpo" ? "default" : "outline"}
						onClick={() => setViewMode("cpo")}
						size="sm"
					>
						CPO Profiles
					</Button>
					<Button 
						variant={viewMode === "stations" ? "default" : "outline"}
						onClick={() => setViewMode("stations")}
						size="sm"
					>
						All Stations
					</Button>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center h-[50vh]">
						<Icons.LoadingIcon className="h-8 w-8 animate-spin" />
					</div>
				) : (
					<div className="space-y-6">
						{viewMode === "cpo" && (
							<div className="grid grid-cols-2 gap-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Total CPOs</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">{cpoProfiles.length}</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm">Active CPOs</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-2xl font-bold">{cpoProfiles.filter(cpo => cpo.status === "active").length}</p>
									</CardContent>
								</Card>
							</div>
						)}

						{viewMode === "stations" && (
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
						)}

						{viewMode === "cpo" && (
							<div className="space-y-4">
								<h2 className="text-lg font-semibold">CPO Profiles</h2>
								{cpoProfiles.map((cpo) => (
									<Card key={cpo.id}>
										<CardHeader>
											<div className="flex justify-between items-start">
												<div>
													<CardTitle className="text-lg">{cpo.name}</CardTitle>
													<p className="text-sm text-muted-foreground">{cpo.phone}</p>
													{cpo.email && <p className="text-sm text-muted-foreground">{cpo.email}</p>}
												</div>
												<Badge variant={cpo.status === "active" ? "default" : "secondary"}>
													{cpo.status}
												</Badge>
											</div>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-3 gap-4 mb-4">
												<div>
													<p className="text-sm text-muted-foreground">Stations</p>
													<p className="text-lg font-semibold">{cpo.stations.length}</p>
												</div>
												<div>
													<p className="text-sm text-muted-foreground">Power Usage</p>
													<p className="text-lg font-semibold">{cpo.totalPowerUsage.toFixed(2)} kWh</p>
												</div>
												<div>
													<p className="text-sm text-muted-foreground">Revenue</p>
													<p className="text-lg font-semibold">₹{cpo.totalRevenue.toFixed(2)}</p>
												</div>
											</div>
											<div className="border-t pt-4">
												<p className="text-sm font-medium mb-2">Assigned Stations</p>
												<div className="space-y-1">
													{cpo.stations.map((station, index) => (
														<p key={station.id} className="text-sm text-muted-foreground">
															{index + 1}. {station.name} - {station.address}
														</p>
													))}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}

						{viewMode === "stations" && (
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
														{existingCPOs.length > 0 && (
															<div>
																<label className="text-xs text-muted-foreground">Select Existing CPO</label>
																<select 
																	className="w-full p-2 border rounded"
																	onChange={(e) => handleSelectExistingCPO(e.target.value)}
																	defaultValue=""
																>
																	<option value="">-- Select Existing CPO --</option>
																	{existingCPOs.map((cpo) => (
																		<option key={cpo.email} value={cpo.email}>
																			{cpo.name} ({cpo.email})
																		</option>
																	))}
																</select>
																<p className="text-xs text-muted-foreground mt-1">Or enter new CPO details below</p>
															</div>
														)}
														<Input placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
														<Input placeholder="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
														<Input placeholder="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
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
															{station.assignedEmail && <p className="text-sm text-muted-foreground">{station.assignedEmail}</p>}
														</div>
														<Button size="sm" variant="outline" onClick={() => {
															setEditingId(station.id);
															setEditName(station.assignedName || "");
															setEditPhone(station.assignedPhone || "");
															setEditEmail(station.assignedEmail || "");
														}}>Edit</Button>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}

						{viewMode === "cpo" && cpoProfiles.length === 0 && (
							<div className="text-center py-10">
								<Icons.UserIcon className="mx-auto h-10 w-10 text-muted-foreground" />
								<p className="mt-2 text-lg font-medium">No CPO profiles found</p>
								<p className="text-sm text-muted-foreground">Assign stations to create CPO profiles</p>
							</div>
						)}

						{viewMode === "stations" && stations.length === 0 && (
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