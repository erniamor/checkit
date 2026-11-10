import { z } from "zod";

interface PaginationLimits {
	defaultPageSize: number;
	maxPageSize: number;
}

/** Query parameters `page` and `pageSize`, bounded by the server. */
export function paginationQuerySchema({
	defaultPageSize,
	maxPageSize,
}: PaginationLimits) {
	return z.object({
		// Query parameters are strings: coerce them to numbers
		page: z.coerce.number().int().min(1).default(1),
		pageSize: z.coerce
			.number()
			.int()
			.min(1)
			.max(maxPageSize)
			.default(defaultPageSize),
	});
}

export interface PaginationQuery {
	page: number;
	pageSize: number;
}

export function offsetOf({ page, pageSize }: PaginationQuery): number {
	return (page - 1) * pageSize;
}
