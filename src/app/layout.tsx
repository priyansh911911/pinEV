import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

import "./globals.css";
import Providers from "@/providers";
import Script from "next/script";
import NativeActions from "@/components/custom/native-actions";
import GetLocation from "@/components/custom/get-location";
import LogoutHandler from "@/components/custom/logout-handler";
import SessionMonitor from "@/components/custom/session-monitor";

const fontSans = Manrope({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	variable: "--font-sans",
});

const SITE_NAME = "EV Pin";
const SITE_DESCRIPTION =
	"Find and share electric vehicle charging stations with EV Pin - the ultimate EV charging network platform.";
const SITE_URL = "https://pinev.net";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: SITE_NAME,
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	keywords: ["EV charging", "electric vehicle", "charging stations", "EV network", "electric car charging"],
	authors: [{ name: "EV Pin Team" }],
	creator: "EV Pin",
	publisher: "EV Pin",
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
		},
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: SITE_URL,
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		siteName: SITE_NAME,
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		creator: "@evpin",
	},
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon.ico",
		apple: "/favicon.ico",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	userScalable: false,
	minimumScale: 1,
	maximumScale: 1,
	initialScale: 1,
	viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const isLocal = process.env.NODE_ENV == "development";
	const googleAPI = isLocal ? process.env.NEXT_PUBLIC_LOCAL_GOOGLE_API_KEY : process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

	return (
		<html lang="en">
			<body className={cn("min-h-screen font-sans antialiased", fontSans.variable)}>
				<Providers>
					{children}

					<GetLocation />
					<NativeActions />
					<LogoutHandler />
					<SessionMonitor />
				</Providers>

				<Script src={`https://maps.googleapis.com/maps/api/js?key=${googleAPI}&libraries=places`}></Script>
			</body>
		</html>
	);
}
