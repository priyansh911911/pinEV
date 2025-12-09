"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { saveStationsSlots, updateStationsSlots } from "@/actions/stations-slots";

interface AddEditSlotModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editSlot: ChargingSlot | null;
	setEditSlot: React.Dispatch<React.SetStateAction<ChargingSlot | null>>;
	stationId: string;
	userId?: string;
	station: AdminStation | null;
	slots: ChargingSlot[];
	setSlots: React.Dispatch<React.SetStateAction<ChargingSlot[]>>;
	loadingState: "idle" | "fetching" | "submitting";
	setLoadingState: React.Dispatch<React.SetStateAction<"idle" | "fetching" | "submitting">>;
}

const AddEditSlotModal: React.FC<AddEditSlotModalProps> = ({
	open,
	onOpenChange,
	editSlot,
	setEditSlot,
	stationId,
	userId,
	station,
	slots,
	setSlots,
	loadingState,
	setLoadingState,
}) => {
	const [newSlot, setNewSlot] = useState<{
		name: string;
		power: string;
		connector_type: string;
		status: "active" | "inactive";
		price_per_minute: number;
		no_of_connector: number;
	}>({ name: "", power: "", connector_type: "Type 2", status: "active", price_per_minute: 0, no_of_connector: 1 });

	const handleAddSlot = async () => {
		if (!newSlot.name || !newSlot.power) {
			toast.error("Please fill in all required fields");
			return;
		}

		setLoadingState("submitting");
		try {
			const slotData = {
				...newSlot,
				station: stationId,
				user: userId,
				schedules: [],
				latitude: station?.latitude || 0,
				longitude: station?.longitude || 0,
				active_connectors: [],
			};

			const res = await saveStationsSlots({ body: slotData });
			if (res.err) {
				console.log("Failed to add charging slot:", res.result);
				toast.error("Failed to add charging slot");
				return;
			}

			const newSlotWithId = {
				...slotData,
				id: res.result.lastInsertID,
			};

			setSlots([...slots, newSlotWithId]);
			onOpenChange(false);
			setNewSlot({
				name: "",
				power: "",
				connector_type: "Type 2",
				status: "active",
				price_per_minute: 0,
				no_of_connector: 1,
			});
			toast.success("Charging device added successfully");
		} catch (error) {
			console.log("Error adding charging device:", error);
			toast.error("Failed to add charging device");
		} finally {
			setLoadingState("idle");
		}
	};

	const handleEditSlot = async () => {
		if (!editSlot || !editSlot.name || !editSlot.power) {
			toast.error("Please fill in all required fields");
			return;
		}

		setLoadingState("submitting");
		try {
			const slotData = {
				name: editSlot.name,
				power: editSlot.power,
				connector_type: editSlot.connector_type,
				status: editSlot.status,
				no_of_connector: editSlot.no_of_connector,
				price_per_minute: editSlot.price_per_minute,
			};
			const res = await updateStationsSlots({ id: editSlot.id, body: slotData });

			if (res.err) {
				console.log("Failed to update charging slot:", res.result);
				toast.error("Failed to update charging slot");
				return;
			}

			setSlots(currentSlots => currentSlots.map(slot => (slot.id === editSlot.id ? editSlot : slot)));
			onOpenChange(false);
			setEditSlot(null);
			toast.success("Charging device updated successfully");
		} catch (error) {
			console.log("Error updating charging device:", error);
			toast.error("Failed to update charging device");
		} finally {
			setLoadingState("idle");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{editSlot ? "Edit Charging Device" : "Add Charging Device"}</DialogTitle>
					<DialogDescription>
						{editSlot
							? "Update the details for this charging device"
							: "Enter the details for the new charging device"}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="slot-name" className="text-right">
							Name
						</Label>
						<Input
							id="slot-name"
							value={editSlot ? editSlot.name : newSlot.name}
							onChange={e =>
								editSlot
									? setEditSlot({ ...editSlot, name: e.target.value })
									: setNewSlot({ ...newSlot, name: e.target.value })
							}
							className="col-span-3"
							placeholder="Device #2"
						/>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="slot-price" className="text-right">
							₹ / Minute
						</Label>
						<Input
							id="slot-price"
							type="number"
							value={editSlot ? editSlot.price_per_minute || "" : newSlot.price_per_minute || ""}
							onChange={e =>
								editSlot
									? setEditSlot({ ...editSlot, price_per_minute: parseFloat(e.target.value) })
									: setNewSlot({ ...newSlot, price_per_minute: parseFloat(e.target.value) })
							}
							className="col-span-3"
							placeholder="e.g. 2.50"
							min={0}
							step="0.1"
						/>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="slot-power" className="text-right">
							Power (kW)
						</Label>
						<Input
							id="slot-power"
							type="number"
							value={editSlot ? editSlot.power : newSlot.power}
							onChange={e =>
								editSlot
									? setEditSlot({ ...editSlot, power: e.target.value })
									: setNewSlot({ ...newSlot, power: e.target.value })
							}
							className="col-span-3"
							placeholder="e.g. 22"
						/>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="no-of-connector" className="text-right">
							No. of Connectors
						</Label>
						<Input
							id="no-of-connector"
							type="number"
							value={editSlot ? editSlot.no_of_connector : newSlot.no_of_connector}
							onChange={e =>
								editSlot
									? setEditSlot({ ...editSlot, no_of_connector: Number(e.target.value) })
									: setNewSlot({ ...newSlot, no_of_connector: Number(e.target.value) })
							}
							className="col-span-3"
							placeholder="e.g. 2"
						/>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="slot-connector" className="text-right">
							Connector
						</Label>
						<Select
							value={editSlot ? editSlot.connector_type : newSlot.connector_type}
							onValueChange={value =>
								editSlot
									? setEditSlot({ ...editSlot, connector_type: value })
									: setNewSlot({ ...newSlot, connector_type: value })
							}
						>
							<SelectTrigger className="col-span-3">
								<SelectValue placeholder="Select connector type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Type 1">Type 1</SelectItem>
								<SelectItem value="Type 2">Type 2</SelectItem>
								<SelectItem value="CCS">CCS</SelectItem>
								<SelectItem value="CHAdeMO">CHAdeMO</SelectItem>
								<SelectItem value="GB/T">GB/T</SelectItem>
								<SelectItem value="Socket">Socket</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="slot-status" className="text-right">
							Status
						</Label>
						<Select
							value={editSlot ? editSlot.status : newSlot.status}
							onValueChange={(value: "active" | "inactive") =>
								editSlot ? setEditSlot({ ...editSlot, status: value }) : setNewSlot({ ...newSlot, status: value })
							}
						>
							<SelectTrigger className="col-span-3">
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						onClick={() => {
							onOpenChange(false);
							setEditSlot(null);
						}}
					>
						Cancel
					</Button>
					<Button type="button" onClick={editSlot ? handleEditSlot : handleAddSlot} disabled={loadingState !== "idle"}>
						{loadingState === "submitting" ? (
							<>
								<Icons.LoadingIcon className="mr-2 h-4 w-4 animate-spin" />
								{editSlot ? "Updating..." : "Adding..."}
							</>
						) : editSlot ? (
							"Update Device"
						) : (
							"Add Device"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddEditSlotModal;
