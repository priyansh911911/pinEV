"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";
import { useRouter } from "next/navigation";
import { FC, HTMLAttributes, ReactNode } from "react";

interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
	left?: React.ReactNode;
	back?: React.ReactNode;
	right?: React.ReactNode;
	headerBackground?: ClassValue;
	customHeader?: ReactNode;
}

const Header: FC<HeaderProps> = ({ customHeader, left, back, right, children, headerBackground, className, ...props }) => {
	const router = useRouter();

	return (
		<div className={cn("w-full fixed top-0 z-[49]", headerBackground)}>
			{customHeader ?? (
				<div className={cn("default-page-width sm:px-6 flex items-center justify-between py-5", className)} {...props}>
					<div className="flex items-center gap-4">
						{left ? (
							left
						) : back ? (
							<Button className="p-0 m-0" variant="link" onClick={() => router.back()}>
								<Icons.ArrowLeftIcon />
							</Button>
						) : null}
						{children}
					</div>
					{right ?? null}
				</div>
			)}
		</div>
	);
};

export default Header;
