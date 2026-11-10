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
