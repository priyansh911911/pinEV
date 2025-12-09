import { FC, ReactNode } from "react";

import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { ClassValue } from "clsx";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

interface CustomDrawerProps {
	showAll?: boolean;
	title: string | ReactNode;
	placeholder?: string;
	description?: string;
	options?: { label: string; value: string }[];
	value?: string;
	onValueChange?: (value: string) => void;
	className?: ClassValue;
	children?: ReactNode;
	displayClose?: boolean;
	disabled?: boolean;
}

const CustomDrawer: FC<CustomDrawerProps> = ({
	showAll,
	title,
	placeholder,
	description,
	options,
	value,
	onValueChange,
	className,
	children,
	displayClose,
	disabled = false,
}) => {
	return (
		<Drawer>
			<DrawerTrigger
				disabled={disabled}
				className={cn(
					"flex items-center justify-between h-9 w-full rounded-md ring-1 ring-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-0 ring-offset-0 capitalize",
					className
				)}
			>
				{typeof title === "string" ? value || title : title}

				{typeof title === "string" && <Icons.ChevronRightIcon className="w-4 h-4 rotate-90" />}
			</DrawerTrigger>

			<DrawerContent className="max-h-[90%]">
				<DrawerHeader>
					<DrawerTitle>{typeof title === "string" ? title : placeholder}</DrawerTitle>
					<DrawerDescription>{description}</DrawerDescription>
					{displayClose && (
						<DrawerClose className="absolute right-4 top-4">
							<Icons.CloseIcon className="w-4 h-4" />
						</DrawerClose>
					)}
				</DrawerHeader>
				<DrawerFooter className="overflow-auto">
					{showAll && (
						<DrawerClosingButton
							key={"All"}
							onClick={() => onValueChange?.("")}
							className={cn({
								"bg-primary text-primary-foreground hover:bg-primary/90": "" === value,
							})}
						>
							{"All"}
						</DrawerClosingButton>
					)}
					{children ?? (
						<>
							{options &&
								options.map(option => (
									<DrawerClosingButton
										key={option.value}
										onClick={() => onValueChange?.(option.value)}
										className={cn({
											"bg-primary text-primary-foreground hover:bg-primary/90": option.value === value,
										})}
									>
										{option.label}
									</DrawerClosingButton>
								))}

							<div className="h-8"></div>
						</>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
};

export default CustomDrawer;

interface DrawerClosingButtonProps {
	children: ReactNode;
	className?: ClassValue;
	onClick?: () => void;
}

export const DrawerClosingButton = ({ children, className, onClick }: DrawerClosingButtonProps) => {
	return (
		<DrawerClose
			className={cn(
				"active:scale-95 transition duration-200 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background border border-ring bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2",
				className
			)}
			onClick={onClick}
		>
			{children}
		</DrawerClose>
	);
};
