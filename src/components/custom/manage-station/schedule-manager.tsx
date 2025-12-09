"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { toast } from "sonner";
import { updateStationsSlots } from "@/actions/stations-slots";

interface ScheduleManagerProps {
	slot: ChargingSlot;
	slots: ChargingSlot[];
	setSlots: React.Dispatch<React.SetStateAction<ChargingSlot[]>>;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ slot, slots, setSlots }) => {
	const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
	const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
	const [startTime, setStartTime] = useState("08:00");
	const [endTime, setEndTime] = useState("20:00");

	const toggleDaySelection = (day: string) => {
		if (selectedDays.includes(day)) {
			setSelectedDays(selectedDays.filter(d => d !== day));
		} else {
			setSelectedDays([...selectedDays, day]);
		}
	};

	const handleAddSchedule = async (slotId: string) => {
		if (selectedDays.length === 0) {
			toast.error("Please select at least one day");
			return;
		}

		if (startTime >= endTime) {
			toast.error("End time must be after start time");
			return;
		}

		const newSchedule = {
			id: `${slotId}-${Date.now()}`,
			days: [...selectedDays],
			start_time: startTime,
			end_time: endTime,
		};

		setSlots(currentSlots =>
			currentSlots.map(slot => (slot.id === slotId ? { ...slot, schedules: [...slot.schedules, newSchedule] } : slot))
		);

		const res = await updateStationsSlots({
			id: slotId,
			body: {
				schedules: [...slot.schedules, newSchedule],
			},
		});

		if (res.err) {
			setSlots(currentSlots =>
				currentSlots.map(slot =>
					slot.id === slotId
						? { ...slot, schedules: slot.schedules.filter(schedule => schedule.id !== newSchedule.id) }
						: slot
				)
			);

			toast.error("Error while updating schedules");
			return;
		}

		toast.success("Schedule added to slot successfully");
		setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
		setStartTime("08:00");
		setEndTime("20:00");
	};

	const handleDeleteSchedule = async (slotId: string, scheduleId: string) => {
		const updatedSchedules = slot.schedules.filter(schedule => schedule.id !== scheduleId);

		setSlots(currentSlots =>
			currentSlots.map(slot =>
				slot.id === slotId
					? {
							...slot,
							schedules: updatedSchedules,
					  }
					: slot
			)
		);

		const res = await updateStationsSlots({
			id: slotId,
			body: {
				schedules: updatedSchedules,
			},
		});

		if (res.err) {
			setSlots(currentSlots =>
				currentSlots.map(slot =>
					slot.id === slotId
						? { ...slot, schedules: slot.schedules.filter(schedule => schedule.id !== scheduleId) }
						: slot
				)
			);

			toast.error("Error while deleting schedule");
			return;
		}

		toast.success("Schedule removed");
	};

	return (
		<div className="space-y-4 pt-2">
			{/* Existing schedules */}
			{slot.schedules.length === 0 ? (
				<p className="text-sm text-muted-foreground italic">No schedules added yet</p>
			) : (
				<div className="space-y-2">
					{slot.schedules.map(schedule => (
						<div key={schedule.id} className="p-3 bg-muted/30 rounded-md flex justify-between items-center">
							<div>
								<span className="font-medium">
									{schedule.days.length > 0
										? schedule.days.length === 7
											? "Every day"
											: schedule.days.join(", ")
										: "No days selected"}
								</span>
								<span className="text-sm text-muted-foreground ml-2">
									{schedule.start_time} - {schedule.end_time}
								</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={() => handleDeleteSchedule(slot.id, schedule.id)}
							>
								<Icons.TrashIcon className="h-4 w-4 text-destructive" />
							</Button>
						</div>
					))}
				</div>
			)}

			{/* Add schedule form */}
			{selectedSlotId === slot.id ? (
				<div className="mt-4 pt-4 border-t border-border">
					<h5 className="font-medium mb-3">Add New Schedule</h5>

					{/* Day Selection */}
					<div className="mb-4">
						<label className="text-sm font-medium mb-2 block">Available Days</label>
						<div className="flex flex-wrap gap-2">
							{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
								<Button
									key={day}
									variant={selectedDays.includes(day) ? "default" : "outline"}
									size="sm"
									onClick={() => toggleDaySelection(day)}
								>
									{day}
								</Button>
							))}
						</div>
					</div>

					{/* Time Selection */}
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label className="text-sm font-medium mb-2 block">Start Time</label>
							<select
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={startTime}
								onChange={e => setStartTime(e.target.value)}
							>
								{Array.from({ length: 24 }, (_, i) => i).map(hour => (
									<option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
										{hour.toString().padStart(2, "0")}:00
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="text-sm font-medium mb-2 block">End Time</label>
							<select
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={endTime}
								onChange={e => setEndTime(e.target.value)}
							>
								{Array.from({ length: 24 }, (_, i) => i).map(hour => (
									<option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
										{hour.toString().padStart(2, "0")}:00
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="flex gap-2">
						<Button variant="default" className="w-full gap-2" onClick={() => handleAddSchedule(slot.id)}>
							<Icons.PlusIcon className="h-4 w-4" />
							Save Schedule
						</Button>
						<Button variant="outline" className="w-full" onClick={() => setSelectedSlotId(null)}>
							Cancel
						</Button>
					</div>
				</div>
			) : (
				<Button variant="outline" className="w-full gap-2 mt-2" onClick={() => setSelectedSlotId(slot.id)}>
					<Icons.PlusIcon className="h-4 w-4" />
					Add Schedule
				</Button>
			)}
		</div>
	);
};

export default ScheduleManager;
