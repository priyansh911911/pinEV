import { cn } from "@/lib/utils";
import { FC, HTMLAttributes } from "react";

interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
	fullWidth?: boolean;
}

const Layout: FC<LayoutProps> = ({ children, fullWidth, ...props }) => {
	return (
		<div
			className={cn("mx-auto max-w-xl bg-background", props.className, {
				"w-full": fullWidth,
				"default-page-width": !fullWidth,
			})}
		>
			{children}
		</div>
	);
};

export default Layout;
