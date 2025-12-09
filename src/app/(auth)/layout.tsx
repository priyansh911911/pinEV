"use client";

import Stores from "@/lib/stores";
import { redirect } from "next/navigation";
import { useEffect } from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
	const { isLoggedin, isLoggedinLoading } = Stores();

	useEffect(() => {
		if (isLoggedinLoading) return;

		if (isLoggedin) redirect("/home");
	}, [isLoggedin, isLoggedinLoading]);

	return children;
};

export default AuthLayout;
