"use client";

import { FC } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import CustomDrawer from "../drawer";
import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import FileUploader from "../file-uploader";

export interface CustomFormFieldProps {
	validation?: validationProps;
	control?: Control<any>;
	component: FormFieldComponent;
	type: FormFieldType;
	name: string;
	label?: string;
	placeholder?: string;
	leftIcon?: React.ReactNode;
	disabled?: boolean;
	dateFormat?: string;
	showTimeSelect?: boolean;
	options?: {
		label: string;
		value: string;
	}[];
	selectOptions?: SelectOptions;
	maxLength?: number;
	renderSkeleton?: (field: unknown) => React.ReactNode;
	children?: React.ReactNode;
	fileUrl?: string;
	uploadFolderName?: string;
}

const RenderField = ({ field, props }: { field: any; props: CustomFormFieldProps }) => {
	const {
		name,
		label,
		component,
		type,
		leftIcon,
		placeholder,
		showTimeSelect,
		dateFormat,
		renderSkeleton,
		options,
		children,
		disabled,
		selectOptions,
		maxLength,
	} = props;

	// const IconComponent = leftIcon ? Icons[leftIcon] : null;

	switch (component) {
		case "input":
			return (
				<FormControl>
					<div className="relative flex items-center rounded-md">
						<div className="absolute left-2 pr-2 border-r text-primary">
							{/* {leftIcon && IconComponent && <IconComponent />} */}
							{leftIcon && leftIcon}
						</div>
						<Input
							placeholder={placeholder}
							{...field}
							maxLength={type === "tel" ? maxLength || 10 : undefined}
							className={cn("w-full text-lg", { "pl-14": leftIcon })}
							disabled={disabled}
							type={type}
						/>
					</div>
				</FormControl>
			);

		case "datePicker":
			return (
				<Popover>
					<PopoverTrigger asChild>
						<FormControl>
							<Button
								disabled={disabled}
								className="w-full h-9 text-start flex items-center justify-start hover:bg-transparent pl-2"
								variant={"outline"}
								type="button"
							>
								<div className="border-r text-primary">
									<Icons.CalendarIcon className="mr-2" />
								</div>
								{field.value ? (
									format(field.value, "dd/MM/yyyy")
								) : (
									<div className="opacity-40">{placeholder}</div>
								)}
							</Button>
						</FormControl>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							className="w-full"
							mode="single"
							selected={field.value}
							onSelect={field.onChange}
							disabled={date => date > new Date() || date < new Date("1900-01-01")}
							// initialFocus
						/>
					</PopoverContent>
				</Popover>
			);

		case "select":
			return (
				<FormControl>
					<>
						<Select onValueChange={field.onChange} value={field.value}>
							<FormControl>
								<div className="relative items-center rounded-md border hidden  md:flex">
									<div className="absolute left-2 pr-2 border-r text-primary hidden md:block">
										<Icons.CalendarIcon />
									</div>
									<div className="ml-12 w-full">
										<SelectTrigger
											disabled={disabled}
											className={cn(
												"hidden md:flex h-9 w-full rounded-md  outline-none  bg-transparent px-3 py-1 text-sm  transition-colors placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-0 ring-offset-0",
												{
													flex: selectOptions?.isOnlySelect,
													"hidden md:hidden": selectOptions?.isOnlyDrawer,
												}
											)}
										>
											<SelectValue placeholder={placeholder} />
										</SelectTrigger>
									</div>
								</div>
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
							disabled={disabled}
							title={placeholder!}
							options={options}
							value={field.value}
							onValueChange={field.onChange}
							className={cn("md:hidden h-12 rounded-xl", {
								hidden: selectOptions?.isOnlySelect,
								"md:flex": selectOptions?.isOnlyDrawer,
							})}
						/>
					</>
				</FormControl>
			);

		case "file":
			return (
				<FormControl>
					<FileUploader
						disabled={disabled}
						files={field.value}
						onChange={field.onChange}
						url={props.fileUrl}
						uploadFolderName={props.uploadFolderName || ""}
						placeholder={placeholder}
					/>
				</FormControl>
			);

		case "textarea":
			return (
				<FormControl>
					<Textarea placeholder={placeholder} {...field} disabled={disabled} />
				</FormControl>
			);

		case "checkbox":
			return (
				<FormControl>
					<div className="flex items-center gap-4">
						<Checkbox id={name} checked={field.value} onCheckedChange={field.onChange} />
						<Label
							htmlFor={name}
							className="cursor-pointer text-sm font-medium text-dark-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 md:leading-none"
						>
							{label}
						</Label>
					</div>
				</FormControl>
			);

		case "skeleton":
			return renderSkeleton ? renderSkeleton(field) : null;
		case "hidden":
			break;
		default:
			break;
	}
};

const CustomFormField: FC<CustomFormFieldProps> = props => {
	const { control, component, name, label } = props;

	if (component === "hidden") {
		return null;
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn("flex-1")}>
					{component !== "checkbox" && label && <FormLabel>{label}</FormLabel>}
					<RenderField field={field} props={props} />
					<FormMessage className="text-destructive" />
				</FormItem>
			)}
		/>
	);
};

export default CustomFormField;
