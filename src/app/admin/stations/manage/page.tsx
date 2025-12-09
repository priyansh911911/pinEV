"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Header from "@/components/custom/header";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Stores from "@/lib/stores";
import { getStationsSlots } from "@/actions/stations-slots";
import { getStations, updateStation } from "@/actions/stations";
import { useStationManagement } from "@/hooks/useStationManagement";
import ChargingSlotsSection from "@/components/custom/manage-station/charging-slots-section";
import StationDetailsSection from "@/components/custom/manage-station/StationDetailsSection";

const ManageStation = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const stationId = searchParams.get("id");
	const { user } = Stores();

	const {
		loadingState,
		setLoadingState,
		station,
		setStation,
		slots,
		setSlots,
		stationStartTime,
		setStationStartTime,
		stationEndTime,
		setStationEndTime,
		pricePerKwh,
		setPricePerKwh,
		taxPercentage,
		setTaxPercentage,
	} = useStationManagement();

	// Fetch data
	const fetchSlots = useCallback(async () => {
		setLoadingState("fetching");
		try {
			const res = await getStationsSlots({ search: `station.id:${stationId}` });
			if (res.err) {
				console.log("Failed to load charging slots:", res.result);
				return;
			}

			const stationRes = await getStations({ search: `id:${stationId}` });
			if (!stationRes.err && stationRes.count > 0) {
				const station = stationRes.result[0];
				setStation(station);
				setPricePerKwh(Number(station.price_per_kwh).toFixed(2) || "");
				setTaxPercentage(station.tax || 0);
				setStationStartTime(station.details?.start_time || "00:00");
				setStationEndTime(station.details?.end_time || "23:59");
			}

			setSlots(res.result);
		} catch (error) {
			console.log("Error fetching charging slots:", error);
			toast.error("Failed to load charging slots");
		} finally {
			setLoadingState("idle");
		}
	}, [
		stationId,
		setLoadingState,
		setStation,
		setPricePerKwh,
		setTaxPercentage,
		setStationStartTime,
		setStationEndTime,
		setSlots,
	]);

	useEffect(() => {
		if (!stationId) return;
		fetchSlots();
	}, [stationId, fetchSlots]);

	const handleSaveChanges = async () => {
		setLoadingState("submitting");
		try {
			await updateStation({
				id: stationId,
				body: {
					price_per_kwh: pricePerKwh,
					tax: taxPercentage,
					details: {
						...(station?.details || {}),
						start_time: stationStartTime,
						end_time: stationEndTime,
					},
				},
			});

			toast.success("Station settings updated successfully");
		} catch (error) {
			console.log("Error saving station settings:", error);
			toast.error("Failed to save changes");
		} finally {
			setLoadingState("idle");
		}
	};

	if (!stationId) {
		return <div>No station ID provided</div>;
	}

	return (
		<>
			<Header back headerBackground="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<h1 className="text-xl font-semibold">Manage Station</h1>
			</Header>

			<Layout className="min-h-screen pb-10">
				<div className="h-24" />

				<div className="space-y-8">
					<ChargingSlotsSection
						stationId={stationId}
						stationName={station?.name}
						slots={slots}
						setSlots={setSlots}
						userId={String(user?.id)}
						station={station}
						loadingState={loadingState}
						setLoadingState={setLoadingState}
					/>

					<StationDetailsSection
						pricePerKwh={pricePerKwh}
						setPricePerKwh={setPricePerKwh}
						taxPercentage={taxPercentage}
						setTaxPercentage={setTaxPercentage}
						stationStartTime={stationStartTime}
						setStationStartTime={setStationStartTime}
						stationEndTime={stationEndTime}
						setStationEndTime={setStationEndTime}
					/>

					<div className="bg-background sticky bottom-0 py-6 mt-8 flex justify-between gap-2">
						<Button className="w-full" onClick={handleSaveChanges} disabled={loadingState !== "idle"}>
							{loadingState === "submitting" ? (
								<>
									<Icons.LoadingIcon className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
						<Button
							onClick={() => router.back()}
							className="w-full"
							variant="outline"
							disabled={loadingState !== "idle"}
						>
							Cancel
						</Button>
					</div>
				</div>
			</Layout>
		</>
	);
};

export default ManageStation;
