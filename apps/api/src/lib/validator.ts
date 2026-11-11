import { zValidator } from "@hono/zod-validator";
import type { ValidationIssue } from "@repo/schemas";
import type { ValidationTargets } from "hono";
import type { z } from "zod";
import { AppError } from "@/lib/errors";

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
