"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout";
import { Icon, Icons } from "@/components/icons";
import { useRouter } from "next/navigation";
import FlatList from "@/components/flat-list";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from "react";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as StationActions from "@/actions/stations";
import Image from "next/image";
import Stores from "@/lib/stores";
import { toast } from "sonner";

const StationListPage = () => {
	const router = useRouter();
	const [stations, setStations] = useState<AdminStation[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<StationStatus | "all">("all");
	const [isLoading, setIsLoading] = useState(false);

	const { user } = Stores();

	const filteredStations = stations.filter(station => {
		const matchesSearch =
			station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			station.address.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = selectedStatus === "all" || station.status === selectedStatus;
		return matchesSearch && matchesStatus;
	});

	const handleGetStations = useCallback(async () => {
		setIsLoading(true);
		try {
			// Fetch all stations, including inactive ones
			const res = await StationActions.getStations({});
			if (res.err) {
				return;
			}

			setStations(res.result);
		} catch (error) {
			console.error("Failed to fetch stations:", error);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	useEffect(() => {
		handleGetStations();
	}, [handleGetStations]);

	return (
		<>
			<Header
				back
				right={
					<Button onClick={() => router.push("/admin/stations/add")} variant="default" size="sm" className="gap-2">
						<Icons.AddIcon className="h-4 w-4" /> Add Station
					</Button>
				}
				headerBackground="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
			>
				<h1 className="text-xl font-semibold">Manage Stations</h1>
			</Header>

			<Layout className="min-h-screen pb-10">
				<div className="h-24" />

				<div className="space-y-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<Input
							type="search"
							placeholder="Search stations..."
							className="w-full"
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
						/>
						<Tabs
							className="overflow-auto"
							value={selectedStatus}
							onValueChange={value => setSelectedStatus(value as StationStatus | "all")}
						>
							<TabsList className="min-w-full sm:w-auto">
								<TabsTrigger className="w-full" value="all">
									All
								</TabsTrigger>
								<TabsTrigger className="w-full" value="pending">
									Pending
								</TabsTrigger>
								<TabsTrigger className="w-full" value="approved">
									Approved
								</TabsTrigger>
								<TabsTrigger className="w-full" value="rejected">
									Rejected
								</TabsTrigger>
								<TabsTrigger className="w-full" value="blocked">
									Blocked
								</TabsTrigger>
								<TabsTrigger className="w-full" value="inactive">
									Inactive
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{isLoading ? (
						<div className="flex size-full h-[30vh] items-center justify-center gap-3">
							<Image src="/assets/icons/loader.svg" alt="loader" width={32} height={32} />
							<span className="text-dark">Loading...</span>
						</div>
					) : (
						<div className="grid gap-4 grid-cols-1">
							<FlatList
								data={filteredStations}
								keyExtractor={station => station.id}
								renderItem={station => (
									<StationCard station={station} setStations={setStations} router={router} />
								)}
							/>
						</div>
					)}

					{filteredStations.length === 0 && !isLoading && (
						<div className="text-center py-10">
							<Icons.SearchXIcon className="mx-auto h-10 w-10 text-muted-foreground/60" />
							<p className="mt-2 text-lg font-medium">No stations found</p>
							<p className="text-sm text-muted-foreground">
								Try adjusting your search or filter to find what you&apos;re looking for.
							</p>
						</div>
					)}
				</div>
			</Layout>
		</>
	);
};

export default StationListPage;

interface StationCardProps {
	station: AdminStation;
	setStations: Dispatch<SetStateAction<AdminStation[]>>;
	router: ReturnType<typeof useRouter>;
}

const StationCard: FC<StationCardProps> = ({ station, setStations, router }) => {
	const getStatusColor = (status: StationStatus) => {
		const colors = {
			pending: "bg-amber-50 text-amber-800 border-amber-200",
			approved: "bg-green-50 text-green-800 border-green-200",
			rejected: "bg-gray-50 text-gray-700 border-gray-200",
			blocked: "bg-red-50 text-red-800 border-red-200",
			inactive: "bg-slate-50 text-slate-700 border-slate-200",
		};
		return colors[status];
	};

	const getStatusIcon = (status: StationStatus) => {
		const icons = {
			pending: <Icons.ClockIcon className="h-3 w-3" />,
			approved: <Icons.CheckIcon className="h-3 w-3" />,
			rejected: <Icons.CloseIcon className="h-3 w-3" />,
			blocked: <Icons.BanIcon className="h-3 w-3" />,
			inactive: <Icons.PauseIcon className="h-3 w-3" />,
		};
		return icons[status];
	};

	const handleUpdateStation = async (id: string, status: StationStatus) => {
		try {
			const res = await StationActions.updateStation({ id, body: { status } });
			if (res.err) {
				console.error("Failed to update station status:", res.result);
				return;
			}

			setStations(prevStations => prevStations.map(station => (station.id === id ? { ...station, status } : station)));
			toast.success(`Station status updated to ${status}`);
		} catch (error) {
			console.error("Error updating station status:", error);
		}
	};

	return (
		<Card className="border border-gray-200 bg-background relative overflow-hidden shadow-md active:scale-[0.98] transition-transform duration-150">
			<Link href={`/admin/stations/view?id=${station.id}`} className="block">
				<CardContent className="p-0">
					{/* Header Section */}
					<div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-t-lg relative">
						{/* Simple corner indicator */}
						<div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-primary/20"></div>

						<div className="flex justify-between items-start gap-3">
							<div className="space-y-2 flex-1">
								<h2 className="text-lg font-semibold text-foreground line-clamp-1">{station.name}</h2>
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<Icons.MapPinIcon className="h-3 w-3 flex-shrink-0" />
									<span className="line-clamp-1">{station.address}</span>
								</div>
								{/* Mobile-friendly tap prompt */}
								<div className="flex items-center gap-1.5 text-xs text-primary/70 font-medium">
									<Icons.EyeIcon className="h-3 w-3" />
									<span>Tap to view details</span>
								</div>
							</div>
							<div className="flex flex-col items-end gap-2">
								{/* View indicator */}
								<div className="flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-1 rounded-full border border-primary/30">
									<Icons.EyeIcon className="h-3 w-3" />
									<span className="font-medium">View</span>
								</div>
								{/* Status badge */}
								<Badge
									variant="secondary"
									className={cn("capitalize font-medium text-xs shadow-sm", getStatusColor(station.status))}
								>
									<span className="flex items-center gap-1">
										{getStatusIcon(station.status)}
										{station.status}
									</span>
								</Badge>
							</div>
						</div>
					</div>

					{/* Content Section */}
					<div className="p-4 space-y-4" onClick={e => e.stopPropagation()}>
						{/* Contact Information */}
						<div className="space-y-2">
							<div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
								<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
									<Icons.PhoneIcon className="h-4 w-4 text-primary" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs text-gray-500 font-medium">Phone</p>
									<p className="text-sm font-semibold text-gray-900 truncate">{station.details.phone}</p>
								</div>
							</div>
							<div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
								<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
									<Icons.MailIcon className="h-4 w-4 text-primary" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs text-gray-500 font-medium">Email</p>
									<p className="text-sm font-semibold text-gray-900 truncate">{station.details.email}</p>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="space-y-3" onClick={e => e.stopPropagation()}>
							<Button
								onClick={e => {
									e.preventDefault();
									e.stopPropagation();
									router.push(`/admin/stations/manage?id=${station.id}`);
								}}
								className="w-full"
								size="sm"
								leftIcon={<Icons.SettingsIcon className="w-4 h-4" />}
							>
								Manage Station
							</Button>

							{/* Status Action Buttons */}
							<div className="grid grid-cols-2 gap-2">
								<div className="grid grid-cols-2 gap-2">
									<Button
										size="sm"
										variant="outline"
										className={cn(
											"text-xs font-medium border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all",
											station.status === "approved" ? "opacity-50 cursor-not-allowed" : ""
										)}
										onClick={e => {
											e.preventDefault();
											e.stopPropagation();
											handleUpdateStation(station.id, "approved");
										}}
										disabled={station.status === "approved"}
									>
										<Icons.CheckIcon className="h-3 w-3 mr-1" />
										Approve
									</Button>
									<Button
										size="sm"
										variant="outline"
										className={cn(
											"text-xs font-medium border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all",
											station.status === "rejected" ? "opacity-50 cursor-not-allowed" : ""
										)}
										onClick={e => {
											e.preventDefault();
											e.stopPropagation();
											handleUpdateStation(station.id, "rejected");
										}}
										disabled={station.status === "rejected"}
									>
										<Icons.CloseIcon className="h-3 w-3 mr-1" />
										Reject
									</Button>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Button
										size="sm"
										variant="outline"
										className={cn(
											"text-xs font-medium border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all",
											station.status === "blocked" ? "opacity-50 cursor-not-allowed" : ""
										)}
										onClick={e => {
											e.preventDefault();
											e.stopPropagation();
											handleUpdateStation(station.id, "blocked");
										}}
										disabled={station.status === "blocked"}
									>
										<Icons.BanIcon className="h-3 w-3 mr-1" />
										Block
									</Button>
									<Button
										size="sm"
										variant="outline"
										className={cn(
											"text-xs font-medium border-gray-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-200 transition-all",
											station.status === "inactive" ? "opacity-50 cursor-not-allowed" : ""
										)}
										onClick={e => {
											e.preventDefault();
											e.stopPropagation();
											handleUpdateStation(station.id, "inactive");
										}}
										disabled={station.status === "inactive"}
									>
										<Icons.PauseIcon className="h-3 w-3 mr-1" />
										Inactive
									</Button>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Link>
		</Card>
	);
};
