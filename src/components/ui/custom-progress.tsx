import { cn } from "@/lib/utils";

interface ProgressProps {
	value?: number;
	className?: string;
}

const CustomProgress = ({ value = 0, className }: ProgressProps) => {
	return (
		<div className={cn("h-2 w-full rounded-full bg-secondary", className)}>
			<div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${value}%` }} />
		</div>
	);
};

export default CustomProgress;
