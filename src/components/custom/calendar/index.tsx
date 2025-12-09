// components/CustomCalendar.tsx
import { useState } from "react";
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, isSameMonth, isPast } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface CustomCalendarProps {
	selectedDate: Date;
	onSelectChange: (date: Date) => void;
	events?: DateEvent[];
	className?: ClassValue;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ selectedDate, onSelectChange, events = [], className }) => {
	const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
	const [direction, setDirection] = useState(0);

	const nextWeek = () => {
		setDirection(1);
		setCurrentWeekStart(addWeeks(currentWeekStart, 1));
	};

	const prevWeek = () => {
		setDirection(-1);
		setCurrentWeekStart(subWeeks(currentWeekStart, 1));
	};

	const onDateClick = (day: Date) => {
		onSelectChange(day);
	};

	const renderHeader = () => {
		const dateFormat = "MMMM yyyy";

		return (
			<div className="flex justify-between items-center mb-4 default-page-width">
				<Button variant="link" size="icon" className="p-0 m-0 text-white" onClick={prevWeek}>
					<Icons.ChevronRightIcon className="rotate-180" />
				</Button>
				<div className="text-lg font-bold">{format(currentWeekStart, dateFormat)}</div>
				<Button variant="link" size="icon" className="p-0 m-0 text-white" onClick={nextWeek}>
					<Icons.ChevronRightIcon />
				</Button>
			</div>
		);
	};

	const renderDays = () => {
		const days = [];
		const dayNames = [];

		for (let i = 0; i < 7; i++) {
			const day = addDays(currentWeekStart, i);
			const event = events.find(event => isSameDay(event.date, day));

			days.push(
				<div
					key={i}
					className={cn(
						"flex-none size-12 m-1 flex items-center justify-center rounded-full cursor-pointer, relative",
						{
							"bg-primary text-background": isSameDay(day, selectedDate),
							"ring-1 ring-inset ring-background": isSameDay(day, new Date()) && !isSameDay(day, selectedDate),
							// "opacity-50": !isSameMonth(day, currentWeekStart),
							"opacity-50": isPast(addDays(day, 1)),
						}
					)}
					onClick={() => onDateClick(day)}
				>
					{format(day, "d")}
					{event && <div className="absolute bottom-0 size-2 bg-primary rounded-full"></div>}
				</div>
			);
			dayNames.push(
				<div key={i} className="flex-none w-12 m-1 flex items-center justify-center text-gray-400">
					{format(day, "EEE")}
				</div>
			);
		}

		return (
			<div className="default-page-width pb-4">
				<div className="w-full flex items-center justify-between mb-2">{dayNames}</div>
				<motion.div
					className="w-full flex items-center justify-between cursor-pointer select-none"
					initial={{ opacity: 0, x: direction === 1 ? 50 : -50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3 }}
					key={currentWeekStart.toString()}
				>
					{days}
				</motion.div>
			</div>
		);
	};

	return (
		<div className={cn("text-white", className)}>
			{renderHeader()}
			{renderDays()}
		</div>
	);
};

export default CustomCalendar;
