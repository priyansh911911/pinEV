"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SlotCard from "./slot-card";
import AddEditSlotModal from "./add-edit-slot-modal";

interface ChargingSlotsSectionProps {
	stationId: string;
	stationName?: string;
	slots: ChargingSlot[];
	setSlots: React.Dispatch<React.SetStateAction<ChargingSlot[]>>;
	userId?: string;
	station: AdminStation | null;
	loadingState: "idle" | "fetching" | "submitting";
	setLoadingState: React.Dispatch<React.SetStateAction<"idle" | "fetching" | "submitting">>;
}

const ChargingSlotsSection: React.FC<ChargingSlotsSectionProps> = ({
	stationId,
	stationName,
	slots,
	setSlots,
	userId,
	station,
	loadingState,
	setLoadingState,
}) => {
	const [showAddSlotModal, setShowAddSlotModal] = useState(false);
	const [editSlot, setEditSlot] = useState<ChargingSlot | null>(null);

	return (
		<div>
			<h3 className="text-xl font-semibold mb-4">Charging Devices of {stationName || "..."}</h3>

			{slots.map(slot => (
				<SlotCard
					key={slot.id}
					slot={slot}
					slots={slots}
					setSlots={setSlots}
					onEditSlot={slot => {
						setEditSlot(slot);
						setShowAddSlotModal(true);
					}}
				/>
			))}

			<Button
				className="gap-2 mt-4"
				onClick={() => {
					setEditSlot(null);
					setShowAddSlotModal(true);
				}}
			>
				<Icons.PlusIcon className="h-4 w-4" />
				Add New Charging Device
			</Button>

			<AddEditSlotModal
				open={showAddSlotModal}
				onOpenChange={setShowAddSlotModal}
				editSlot={editSlot}
				setEditSlot={setEditSlot}
				stationId={stationId}
				userId={userId}
				station={station}
				slots={slots}
				setSlots={setSlots}
				loadingState={loadingState}
				setLoadingState={setLoadingState}
			/>
		</div>
	);
};

export default ChargingSlotsSection;
