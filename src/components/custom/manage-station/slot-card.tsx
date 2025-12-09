"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ScheduleManager from "./schedule-manager";

interface SlotCardProps {
	slot: ChargingSlot;
	slots: ChargingSlot[];
	setSlots: React.Dispatch<React.SetStateAction<ChargingSlot[]>>;
	onEditSlot: (slot: ChargingSlot) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, slots, setSlots, onEditSlot }) => {
	return (
		<Card className="mb-2">
			<CardContent className="p-6">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h4 className="text-lg font-medium">{slot.name}</h4>
						<p className="text-sm text-muted-foreground">
							{slot.connector_type} • {slot.power} kW
						</p>
						<p className="text-sm text-muted-foreground">{slot.price_per_minute} ₹/min</p>
					</div>
					<Badge
						variant="outline"
						className={slot.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
					>
						{slot.status === "active" ? "Active" : "Inactive"}
					</Badge>
				</div>

				<Accordion type="single" collapsible className="w-full">
					<AccordionItem value="schedules">
						<AccordionTrigger className="py-2">
							<span className="flex items-center text-sm font-medium">
								<Icons.ClockIcon className="mr-2 h-4 w-4" />
								Availability Schedules ({slot.schedules.length})
							</span>
						</AccordionTrigger>
						<AccordionContent>
							<ScheduleManager slot={slot} slots={slots} setSlots={setSlots} />
						</AccordionContent>
					</AccordionItem>
				</Accordion>

				<div className="flex gap-2 mt-4">
					<Button onClick={() => onEditSlot({ ...slot })} variant="outline" size="sm" className="flex-1">
						<Icons.EditIcon className="h-4 w-4 mr-2" />
						Edit Device
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default SlotCard;
