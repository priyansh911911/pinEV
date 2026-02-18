"use client";

import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/layout";
import { formatDate } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Header from "@/components/custom/header";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import Stores from "@/lib/stores";
import { useRouter } from "next/navigation";
import MyVehicles from "@/components/custom/my-vehicles";
import { stopActiveChargingSessions } from "@/functions/logout-handler";
import { toast } from "sonner";
import { useState } from "react";

const ProfilePage = () => {
	const { user } = Stores();

	return (
		<>
			<Header right={<HeaderDrawer user={user} />} headerBackground="bg-foreground">
				<h1 className="text-lg font-semibold text-background">Profile</h1>
			</Header>

			<Layout fullWidth className="pt-24 pb-10 bg-foreground rounded-b-3xl overflow-hidden">
				<div className="flex flex-col justify-center">
					<div className="w-20 rounded-full mx-auto">
						<Image src="/assets/images/user.png" alt="user-profile-pic" className="w-full" width={100} height={100} />
					</div>
					<h2 className="text-white text-center font-bold border px-4 mt-4 mx-auto py-1.5 border-gray-400 rounded-full inline-block">
						{user?.name || "Guest User"}
					</h2>
					{/* <p className="text-center text-xs text-gray-300 mt-2"> */}
					{/* Member Since {formatDate("MMM, YYYY", new Date("2019-01-01"))} // TODO: Replace with actual date */}
					{/* </p> */}
				</div>
			</Layout>
			{user && <MyVehicles user={user} />}
		</>
	);
};

export default ProfilePage;

const HeaderDrawer = ({ user }: { user: User }) => {
	const router = useRouter();
	const { isLoggedin, setUser, setSession, setIsLoggedin } = Stores();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	return (
		<Drawer>
			<DrawerTrigger asChild>
				<Button variant="link" size="icon" className="p-0 m-0 text-background">
					<Icons.ThreeDotIcon />
				</Button>
			</DrawerTrigger>
			<DrawerContent className="max-h-[90%] default-page-width !w-full">
				<DrawerHeader>
					<DrawerTitle>Menu</DrawerTitle>
				</DrawerHeader>
				<div className="px-4 flex-1">
					<div className="space-y-4">
						{[
							// ...(isLoggedin ? [{ icon: <Icons.WalletIcon />, label: "Wallet", href: "/wallet" }] : []),
							{ icon: <Icons.HelpCircleIcon />, label: "Help & Support", href: "/support" },
							{ icon: <Icons.ShieldIcon />, label: "Privacy Policy", href: "/privacy" },
							{ icon: <Icons.RefreshCcwIcon />, label: "Refund Policy", href: "/refund-policy" },
							// { icon: <Icons.StoreIcon />, label: "CPO Login", href: "/cpo-portal/login" }, // TODO: Uncomment when needed
							...(user?.role === "Admin" ? [{ icon: <Icons.SettingsIcon />, label: "Admin", href: "/admin" }] : []),
							// { icon: <Icons.SettingsIcon />, label: "Admin", href: "/admin" }, // TODO: Remove this after admin panel is done
							// { icon: <Icons.SettingsIcon />, label: "Settings", href: "/settings" },
						].map(item => (
							<div key={item.href}>
								<Link href={item.href}>
									<div className="flex items-center gap-3 py-3">
										<span className="text-muted-foreground">{item.icon}</span>
										<span className="font-medium">{item.label}</span>
									</div>
								</Link>
								<Separator />
							</div>
						))}
					</div>
				</div>
				<DrawerFooter className="pb-20">
					{isLoggedin ? (
						<Button
							onClick={() => {
								setIsLoggingOut(true);

								// Stop charging sessions and logout
								if (user?.id) {
									stopActiveChargingSessions(String(user.id), 'logout').catch(console.error);
								}

								// Clear user session
								setUser({} as User);
								setSession("");
								setIsLoggedin(false);

								// Navigate after state updates
								setTimeout(() => {
									router.push("/login");
								}, 100);
							}}
							variant="destructive"
							className="w-full"
							disabled={isLoggingOut}
						>
							<Icons.LogOutIcon className="mr-2 h-4 w-4" />
							{isLoggingOut ? "Logging out..." : "Logout"}
						</Button>
					) : (
						<Link href="/login" className="w-full">
							<Button className="w-full">
								<Icons.LogOutIcon className="mr-2 h-4 w-4" />
								Login
							</Button>
						</Link>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
};
