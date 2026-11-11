import type { z } from "zod";
import { errorMessage } from "@/lib/error-messages";

type FieldResult<Value> =
	| { ok: true; value: Value }
	| { ok: false; error: string };

/**
 * Validates one field with its schema from @repo/schemas, before an optimistic
 * update: the error comes back translated, ready to show next to the field.
 */
export function validateField<Schema extends z.ZodType>(
	schema: Schema,
	value: unknown,
): FieldResult<z.output<Schema>> {
	const result = schema.safeParse(value);
	if (result.success) {
		return { ok: true, value: result.data };
	}
	return {
		ok: false,
		error: errorMessage(result.error.issues[0]?.message ?? ""),
	};
}
