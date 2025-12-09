"use client";

import Stores from "@/lib/stores";
import { redirect } from "next/navigation";
import { FC } from "react";

interface MainLayoutProps {
	children: React.ReactNode;
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
	const { isLoggedin } = Stores();

	if (!isLoggedin) {
		redirect("/login");
	}

	return <>{children}</>;
};

export default MainLayout;
