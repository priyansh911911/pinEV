import BottomTabs from "@/components/custom/bottom-tabs";

export default function WithBottomTabsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<>
			{children}
			<BottomTabs />
		</>
	);
}
