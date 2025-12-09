import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import { formatDuration, intervalToDuration } from "date-fns";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(format: string, date: Date | "today" = "today") {
	if (date === "today") {
		return dayjs().format(format);
	}

	return dayjs(date).format(format);
}

export function formatCurrency(amount: number, maximumFractionDigits: number = 2) {
	const Rupees = Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits,
	});

	return Rupees.format(amount);
}

export const generateID = (pattern: string): string => {
	const randomCharMap: { [key: string]: () => string } = {
		X: () => String.fromCharCode(65 + Math.floor(Math.random() * 26)),
		x: () => String.fromCharCode(97 + Math.floor(Math.random() * 26)),
		"9": () => Math.floor(Math.random() * 10).toString(),
	};

	let result = "";
	for (let i = 0; i < pattern.length; i++) {
		const char = pattern[i];
		result += randomCharMap[char]?.() ?? char;
	}

	return result;
};

export function sendToNative(data: any) {
	// @ts-ignore
	window.ReactNativeWebView.postMessage(JSON.stringify(data));
}

export function calculatedDuration(start: Date, end: Date, { short }: { short?: boolean } = { short: false }): string {
	const duration = intervalToDuration({ start, end });

	const formattedDuration = formatDuration(duration);

	return short
		? formattedDuration
				.replace(/\byears?\b/g, "yr")
				.replace(/\bmonths?\b/g, "mo")
				.replace(/\bdays?\b/g, "d")
				.replace(/\bhours?\b/g, "hr")
				.replace(/\bminutes?\b/g, "min")
				.replace(/\bseconds?\b/g, "sec")
		: formattedDuration;
}

export const capitalizeSentence = (str: string): string => {
	return str
		.split(" ")
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export function toUrlSafeBase64(input: string): string {
	return btoa(input).replace(/=+$/, ""); // Remove padding =
}

export function splitAmountWithTax(totalPaidAmount: number, taxPercentage: number): { baseAmount: number; taxAmount: number } {
	if (taxPercentage < 0 || totalPaidAmount < 0) {
		return { baseAmount: 0, taxAmount: 0 };
	}

	const baseAmount = totalPaidAmount / (1 + taxPercentage / 100);
	const taxAmount = totalPaidAmount - baseAmount;

	return {
		baseAmount: parseFloat(baseAmount.toFixed(2)),
		taxAmount: parseFloat(taxAmount.toFixed(2)),
	};
}

export function inBetweenRandomGenerator(min: number, max: number) {
	if (min > max) return "0";
	return (min + Math.random() * (max - min)).toFixed(0);
}
