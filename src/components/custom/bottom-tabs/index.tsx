"use client";

import FlatList from "@/components/flat-list";
import { Icon, Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC } from "react";

interface BottomTabsProps {}

type TAB = {
	id: string;
	name: string;
	href: string;
	icon: Icon;
};

const TABS: TAB[] = [
	{ id: "1", name: "Home", href: "/home", icon: "PinHomeIcon" },
	{ id: "3", name: "Bookings", href: "/bookings", icon: "BatteryChargingIcon" },
	// { id: "2", name: "Plan A Trip", href: "/plan-a-trip", icon: "RoadIcon" },
	{ id: "2", name: "Wallet", href: "/wallet", icon: "WalletIcon" },
	{ id: "4", name: "Profile", href: "/profile", icon: "UserIcon" },
];

const BottomTabs: FC<BottomTabsProps> = ({}) => {
	const pathName = usePathname();

	return (
		<div className="bottom-tab">
			<div className="default-page-width bg-foreground flex items-center justify-evenly py-4 rounded-full">
				<FlatList data={TABS} keyExtractor={tab => tab.id} renderItem={tab => <Tab tab={tab} pathName={pathName} />} />
			</div>
		</div>
	);
};

export default BottomTabs;

const Tab: FC<{ tab: TAB; pathName: string }> = ({ tab, pathName }) => {
	const Icon = Icons[tab.icon];
	return (
		<Link href={tab.href}>
			<Icon
				className={cn("w-8 h-auto text-background/80 transition-all duration-300", {
					"w-8 h-auto ": tab.name === "Home",
					"w-10 h-auto": tab.name === "Profile",
					"-rotate-90 w-10 h-auto": tab.name === "Bookings",
					"text-primary scale-125": pathName.includes(tab.href),
				})}
			/>
		</Link>
	);
};
