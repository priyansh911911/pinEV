import { CustomFormFieldProps } from "@/components/custom/form-field";
import { z } from "zod";

function getValidationType(validation: any) {
	let schema: any;

	if (validation.type.value === "string") {
		schema = z.string({
			message: validation.type.message || "Cannot be empty",
		});
	}
	if (validation.type.value === "number") {
		schema = z.number({
			message: validation.type.message || "Cannot be empty",
		});
	}
	if (validation.type.value === "date") {
		schema = z.date({
			message: validation.type.message || "Cannot be empty",
		});
	}
	if (validation.type.value === "any") {
		schema = z.any();
	}

	if (validation?.min) {
		schema = schema.min(validation.min.value, {
			message: validation.min.message || "Minimum value is required",
		});
	}
	if (validation?.max) {
		schema = schema.max(validation.max.value, {
			message: validation.max.message || "Maximum value is required",
		});
	}
	if (validation?.optional) {
		schema = schema.optional();
	}

	return schema;
}

function convertInputToOutput(input: CustomFormFieldProps[]) {
	const result: any = {};
	const key: any = [];

	input.forEach(item => {
		const keys = item.name.split(".");
		if (keys.length > 1 && !key.includes(keys[0])) {
			key.push(keys[0]);
		}
		let current = result;
		keys.forEach((key: string, index) => {
			if (index === keys.length - 1) {
				// current[key] = item.validation;
				current[key] = getValidationType(item.validation);
			} else {
				if (!current[key]) {
					current[key] = {};
				}
				current = current[key];
			}
		});
	});

	key && key.map((k: any) => (result[k] = z.object(result[k])));
	return result;
}

export const CustomFormValidation = (schema: CustomFormFieldProps[]) => {
	const validations = convertInputToOutput(schema);
	return z.object(validations).passthrough();
};
