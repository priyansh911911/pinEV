import { FC } from "react";

import CustomDrawer from "../drawer";
import { cn } from "@/lib/utils";
import { FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormFieldSelectProps {
	field: any;
	options?: { label: string; value: string }[];
	placeholder?: string;
	selectOptions?: SelectOptions;
}

const FormFieldSelect: FC<FormFieldSelectProps> = ({ field, options, placeholder, selectOptions }) => {
	return (
		<FormControl>
			<>
				<Select onValueChange={field.onChange} value={field.value}>
					<FormControl>
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
					</FormControl>
					<SelectContent>
						{options &&
							options?.map(option => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
					</SelectContent>
				</Select>

				<CustomDrawer
					title={placeholder!}
					options={options!}
					value={field.value}
					onValueChange={field.onChange}
					className={cn("md:hidden", {
						hidden: selectOptions?.isOnlySelect,
						"md:flex": selectOptions?.isOnlyDrawer,
					})}
				/>
			</>
		</FormControl>
	);
};

export default FormFieldSelect;
