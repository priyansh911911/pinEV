"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FlatList from "@/components/flat-list";
import { format } from "date-fns";
import * as ChargingActions from "@/actions/vehicles-chargings";
import { toast } from "sonner";
import { Zap, Battery, Clock, MapPin, User, Car, MoreVertical, Trash2, Edit } from "lucide-react";

// Charging Session type definition matching DB schema
type ChargingStatus = "pending" | "active" | "scheduled" | "completed" | "cancelled" | "failed";

interface ChargingSession {
	id: number;
	datetime: string;
	amount_paid: number;
	user: number;
	vehicle: number;
	station: number;
	charging_slot: number;
	transaction: number;
	duration_in_minute: number;
	status: ChargingStatus;
	started_at: string | null;
	final_amount: number;
	stopped_at: string | null;
	charge_reading: number;
	charge_txn_id: string;
	initial_reading: any; // JSON string in DB
	final_reading: any; // JSON string in DB
	created_at: string;
	updated_at: string;
}

const ChargingSessionsAdminPage = () => {
	const router = useRouter();
	const [sessions, setSessions] = useState<ChargingSession[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<ChargingStatus | "all">("all");
	const [timeFilter, setTimeFilter] = useState('All Time');
	const [isLoading, setIsLoading] = useState(false);

	// Delete state
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

	const filteredSessions = sessions.filter(session => {
		const matchesSearch =
			session.id.toString().includes(searchQuery) ||
			session.station.toString().includes(searchQuery) ||
			session.user.toString().includes(searchQuery);
		const matchesStatus = selectedStatus === "all" || session.status === selectedStatus;

		let matchesTime = true;
		if (timeFilter !== 'All Time') {
			const date = new Date(session.datetime || session.created_at);
			const now = new Date();
			const diffTime = Math.abs(now.getTime() - date.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			if (timeFilter === 'Today') {
				matchesTime = date.toDateString() === now.toDateString();
			} else if (timeFilter === 'Week') {
				matchesTime = diffDays <= 7;
			} else if (timeFilter === 'Month') {
				matchesTime = diffDays <= 30;
			} else if (timeFilter === '6 Months') {
				matchesTime = diffDays <= 180;
			}
		}

		return matchesSearch && matchesStatus && matchesTime;
	});

	const handleGetSessions = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await ChargingActions.getVehiclesChargings();

			if (res.err) {
				console.error("Error fetching charging sessions:", res.result);
				return;
			}

			const sessionsData = Array.isArray(res.result) ? res.result : [];
			// Cast the status to ensure it matches our type if DB has 'failed'
			const sanitizedSessions = sessionsData.map((s: any) => ({
				...s,
				status: (['pending', 'active', 'scheduled', 'completed', 'cancelled'].includes(s.status) ? s.status : 'cancelled') as ChargingStatus
			}));
			setSessions(sanitizedSessions);
		} catch (error) {
			console.error("Failed to fetch charging sessions:", error);
			toast.error("Failed to fetch charging sessions");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleUpdateStatus = async (id: number, status: ChargingStatus) => {
		try {
			const res = await ChargingActions.updateVehicleCharging({ id, body: { status } });
			if (res?.err) {
				toast.error("Failed to update status");
				return;
			}
			// Optimistic update
			setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
			toast.success(`Session status updated to ${status}`);
		} catch (error) {
			console.error("Update failed:", error);
			toast.error("Failed to update status");
		}
	};

	const confirmDelete = async () => {
		if (!sessionToDelete) return;
		try {
			const res = await ChargingActions.deleteVehicleCharging({ id: sessionToDelete });
			if (res?.err) {
				toast.error("Failed to delete session");
				return;
			}
			setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
			toast.success("Session deleted successfully");
			setDeleteOpen(false);
			setSessionToDelete(null);
		} catch (error) {
			console.error("Delete failed:", error);
			toast.error("Failed to delete session");
		}
	};

	useEffect(() => {
		handleGetSessions();
	}, [handleGetSessions]);

	// Helper to parse reading JSON safely
	const parseReading = (reading: any) => {
		try {
			if (typeof reading === 'string') return JSON.parse(reading);
			return reading;
		} catch (e) {
			return null;
		}
	};

	return (
		<>
			<Header headerBackground="bg-white" back>
				<h2 className="text-lg font-bold">Charging Sessions</h2>
			</Header>
			<Layout>
				<div className="mt-[90px] pb-20">
					<div className="mb-5">
						<div className="flex flex-col gap-4 mb-4">
							<Input
								type="text"
								placeholder="Search by Session ID, Station ID, or User ID..."
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
							/>

							{/* Time Filters */}
							<div className="flex flex-wrap gap-2">
								{['All Time', 'Today', 'Week', 'Month', '6 Months'].map((filter) => (
									<Button
										key={filter}
										variant={timeFilter === filter ? "default" : "outline"}
										size="sm"
										onClick={() => setTimeFilter(filter)}
										className="text-xs h-8"
									>
										{filter}
									</Button>
								))}
							</div>
						</div>

						<Tabs defaultValue="all" onValueChange={value => setSelectedStatus(value as ChargingStatus | "all")}>
							<TabsList className="w-full justify-start overflow-x-auto mb-4">
								<TabsTrigger value="all">All</TabsTrigger>
								<TabsTrigger value="active">Active</TabsTrigger>
								<TabsTrigger value="scheduled">Scheduled</TabsTrigger>
								<TabsTrigger value="completed">Completed</TabsTrigger>
								<TabsTrigger value="cancelled">Cancelled</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* Summary Card */}
					<Card className="mb-6">
						<CardContent className="p-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Total Sessions</span>
									<span className="text-lg font-bold">{isLoading ? "..." : sessions.length}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Active/Completed</span>
									<span className="text-lg font-bold">
										{isLoading ? "..." : sessions.filter(s => s.status === "completed").length}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{isLoading ? (
						<div className="flex items-center justify-center min-h-[200px]">
							<Icons.LoadingIcon className="w-6 h-6 animate-spin" />
						</div>
					) : filteredSessions.length > 0 ? (
						<div className="space-y-4">
							{filteredSessions.map((session) => (
								<Card key={session.id} className="hover:shadow-md transition-shadow relative">
									<CardContent className="p-3">
										<div className="flex justify-between items-start mb-2">
											<div className="flex flex-col">
												<div className="flex items-center gap-2">
													<Badge variant="outline" className="font-mono text-xs">#{session.id}</Badge>
													<span className="text-sm text-muted-foreground">
														{format(new Date(session.datetime || session.created_at), "MMM d, yyyy h:mm a")}
													</span>
												</div>
											</div>

											<div className="flex items-center gap-2">
												<Badge
													variant={
														session.status === "completed"
															? "default"
															: session.status === "cancelled" || session.status === "failed"
																? "destructive"
																: "secondary"
													}
													className={
														session.status === 'completed'
															? 'bg-green-100 text-green-700 hover:bg-green-200 border-none'
															: session.status === 'active'
																? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200 animate-pulse'
																: session.status === 'scheduled'
																	? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-none'
																	: ''
													}
												>
													{session.status.toUpperCase()}
												</Badge>

												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
															<MoreVertical className="h-4 w-4 text-slate-500" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuLabel>Actions</DropdownMenuLabel>
														<DropdownMenuSeparator />
														{/* <DropdownMenuItem onClick={() => handleUpdateStatus(session.id, 'scheduled')}>
															Mark Scheduled
														</DropdownMenuItem> */}
														<DropdownMenuItem onClick={() => handleUpdateStatus(session.id, 'completed')}>
															Mark Completed
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleUpdateStatus(session.id, 'cancelled')}>
															Mark Cancelled
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4 mb-4">
											<div className="flex items-start gap-2">
												<MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
												<div className="flex flex-col">
													<span className="text-xs text-muted-foreground">Station</span>
													<span className="text-sm font-medium">#{session.station}</span>
												</div>
											</div>
											<div className="flex items-start gap-2">
												<User className="w-4 h-4 text-slate-400 mt-0.5" />
												<div className="flex flex-col">
													<span className="text-xs text-muted-foreground">User</span>
													<span className="text-sm font-medium">#{session.user}</span>
												</div>
											</div>
											<div className="flex items-start gap-2">
												<Car className="w-4 h-4 text-slate-400 mt-0.5" />
												<div className="flex flex-col">
													<span className="text-xs text-muted-foreground">Vehicle</span>
													<span className="text-sm font-medium">#{session.vehicle}</span>
												</div>
											</div>
											<div className="flex items-start gap-2">
												<Clock className="w-4 h-4 text-slate-400 mt-0.5" />
												<div className="flex flex-col">
													<span className="text-xs text-muted-foreground">Duration</span>
													<span className="text-sm font-medium">{session.duration_in_minute} mins</span>
												</div>
											</div>
										</div>

										{/* Energy & Amount */}
										<div className="bg-slate-50 rounded-lg p-3 flex justify-end gap-4">
											{/* <div className="flex items-center gap-2">
												<Zap className="w-4 h-4 text-amber-500" />
												<div className="flex flex-col">
													<span className="text-xs text-muted-foreground">Energy Consumed</span>
													<span className="text-sm font-bold">
														{parseReading(session.final_reading)?.energy
															? (parseFloat(parseReading(session.final_reading)?.energy) - parseFloat(parseReading(session.initial_reading)?.energy || 0)).toFixed(2)
															: '0.00'} kWh
													</span>
												</div>
											</div> */}
											<div className="flex items-center gap-2 justify-end text-right">
												<div className="flex flex-col">
													<span className="text-xs text-muted-foreground">Final Amount</span>
													<span className="text-lg font-bold text-green-600">₹{session.final_amount ?? 0}</span>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center min-h-[200px] text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
							<Zap className="w-12 h-12 text-slate-300 mb-3" />
							<h3 className="text-lg font-medium text-slate-900 mb-1">No Charging Sessions</h3>
							<p className="text-sm text-slate-500 max-w-xs">
								There are no charging sessions matching your current filters.
							</p>
						</div>
					)}

					<Button
						variant="outline"
						onClick={() => handleGetSessions()}
						className="fixed bottom-5 right-5 rounded-full shadow-lg bg-white"
						size="icon"
					>
						<Icons.RefreshCcwIcon className="w-4 h-4" />
					</Button>

					<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
						<AlertDialogContent className="max-w-[90%] md:max-w-lg rounded-xl">
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Charging Session</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete this charging session? This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</Layout>
		</>
	);
};

export default ChargingSessionsAdminPage;
