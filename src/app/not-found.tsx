"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const Custom404 = () => {
	const router = useRouter();

	return (
		<div className="flex items-center justify-center h-screen bg-neutral-100">
			<div className="bg-background shadow-md rounded-lg p-8 max-w-md text-center">
				<h1 className="text-6xl font-bold text-primary">404</h1>
				<p className="text-xl mt-4 mb-6 text-neutral-700">Oops! The page you are looking for does not exist.</p>
				<Button onClick={() => router.back()} className="font-semibold text-lg">
					Go Home
				</Button>
			</div>
		</div>
	);
};

export default Custom404;
