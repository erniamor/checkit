import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { z } from "zod";
import { AppError } from "@/lib/errors";

export interface ValidationIssue {
	/** Dotted path of the invalid field, empty for the whole input. */
	field: string;
	/** Error code (the schema's message), translated by the front ends. */
	message: string;
}

/** `zValidator` answering invalid input with a 422 in the API's error format. */
export function validate<
	Target extends keyof ValidationTargets,
	Schema extends z.ZodType,
>(target: Target, schema: Schema) {
	return zValidator(target, schema, (result) => {
		if (!result.success) {
			const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
				field: issue.path.map(String).join("."),
				message: issue.message,
			}));
			throw new AppError(422, "validation_error", "Invalid request", issues);
		}
	});
}
