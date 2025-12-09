import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const FilterByTimeDrawer = ({
	timeFilter,
	setTimeFilter,
}: {
	timeFilter: string;
	setTimeFilter: React.Dispatch<React.SetStateAction<string>>;
}) => {
	return (
		<Drawer>
			<DrawerTrigger asChild>
				<Button
					variant="outline"
					leftIcon={<Icons.CalendarIcon className="h-5 w-auto" />}
					rightIcon={
						<div
							className={cn("size-4 rounded-full bg-primary", {
								hidden: timeFilter === "all",
							})}
						/>
					}
				>
					Filter by time
				</Button>
			</DrawerTrigger>
			<DrawerContent className="max-h-[90%] default-page-width !w-full mb-10">
				<DrawerHeader>
					<DrawerTitle>Filter by time</DrawerTitle>
				</DrawerHeader>
				<div className="px-4 flex-1">
					<div className="space-y-4">
						{[
							{ icon: <Icons.ClockIcon />, label: "All Time", value: "all" },
							{ icon: <Icons.CalendarIcon />, label: "Today", value: "today" },
							{ icon: <Icons.CalendarIcon />, label: "This Week", value: "week" },
							{ icon: <Icons.CalendarIcon />, label: "This Month", value: "month" },
						].map(item => (
							<div
								key={item.value}
								onClick={() => {
									setTimeFilter(item.value);
									// Close drawer after selection
									const drawer = document.querySelector('[data-state="open"]');
									if (drawer) {
										(drawer as HTMLElement).click();
									}
								}}
							>
								<div className="flex items-center gap-3 py-3 cursor-pointer">
									<span className={`${timeFilter === item.value ? "text-primary" : "text-muted-foreground"}`}>
										{item.icon}
									</span>
									<span className={`font-medium ${timeFilter === item.value ? "text-primary" : ""}`}>
										{item.label}
									</span>
								</div>
								<Separator />
							</div>
						))}
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
};

export default FilterByTimeDrawer;
