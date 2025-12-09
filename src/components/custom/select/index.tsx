import { FC } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import CustomDrawer from "../drawer";
import { cn } from "@/lib/utils";

interface FormFieldSelectProps {
	showAll?: boolean;
	onChange?: any;
	value?: any;
	options?: { label: string; value: string }[];
	placeholder?: string;
	selectOptions?: SelectOptions;
}

const CustomSelect: FC<FormFieldSelectProps> = ({ showAll, onChange, value, options, placeholder, selectOptions }) => {
	return (
		<>
			<Select onValueChange={onChange} value={value}>
				<SelectTrigger
					className={cn(
						"hidden md:flex h-9 w-full rounded-md ring-1 ring-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-0 ring-offset-0",
						{
							flex: selectOptions?.isOnlySelect,
							"hidden md:hidden": selectOptions?.isOnlyDrawer,
						}
					)}
				>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>

				<SelectContent>
					{showAll && (
						<SelectItem key={"All"} value={"All"}>
							All
						</SelectItem>
					)}
					{options &&
						options?.map(option => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
				</SelectContent>
			</Select>

			<CustomDrawer
				showAll={showAll}
				title={placeholder!}
				options={options!}
				value={value}
				onValueChange={onChange}
				className={cn("md:hidden", {
					hidden: selectOptions?.isOnlySelect,
					"md:flex": selectOptions?.isOnlyDrawer,
				})}
			/>
		</>
	);
};

export default CustomSelect;
