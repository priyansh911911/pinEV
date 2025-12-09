"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import { StoreProvider } from "./StoreProvider";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

interface ProviderProps {
	children: ReactNode;
}

const Providers: FC<ProviderProps> = ({ children }) => {
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		setIsLoaded(true);
	}, []);

	if (!isLoaded) {
		return null; // or a loading spinner
	}

	return (
		<StoreProvider>
			<ThemeProvider attribute="class" defaultTheme="light">
				{children}
				<Toaster position="top-center" />
			</ThemeProvider>
		</StoreProvider>
	);
};

export default Providers;
