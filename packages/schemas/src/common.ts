import { z } from "zod";

// Dates travel as ISO 8601 strings in JSON
export const dateTimeSchema = z.iso.datetime();

export const paginationSchema = z.object({
	page: z.number().int().min(1),
	pageSize: z.number().int().min(1),
	total: z.number().int().min(0),
});

export type Pagination = z.infer<typeof paginationSchema>;

/** Response envelope of a paginated list: `{ data, pagination }`. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
	return z.object({ data: z.array(item), pagination: paginationSchema });
}

export interface Paginated<T> {
	data: T[];
	pagination: Pagination;
}

// Error messages are codes, translated by the front ends.
// trim() and toLowerCase(): emails are compared case-insensitively.
export const emailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email("email_invalid"));

/** One invalid field of a 422 error. */
export const validationIssueSchema = z.object({
	/** Dotted path of the field, empty for the whole input. */
	field: z.string(),
	/** Error code, e.g. "list_name_required". */
	message: z.string(),
});

export type ValidationIssue = z.infer<typeof validationIssueSchema>;

/** Body of every error response of the API. */
export const apiErrorBodySchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
