import type { Paginated } from "@repo/schemas";

/** A page of results, without the API's `{ data, pagination }` envelope. */
export interface Page<T> {
	items: T[];
	page: number;
	pageSize: number;
	total: number;
}

export interface PageOptions {
	page?: number;
	pageSize?: number;
	signal?: AbortSignal;
}

export function toPage<T>({ data, pagination }: Paginated<T>): Page<T> {
	return { items: data, ...pagination };
}

/** Adds the defined query parameters to a path. */
export function withQuery(
	path: string,
	params: Record<string, string | number | undefined>,
): string {
	const search = new URLSearchParams();
	for (const [name, value] of Object.entries(params)) {
		if (value !== undefined) {
			search.set(name, String(value));
		}
	}
	const query = search.toString();
	return query ? `${path}?${query}` : path;
}

/** A path segment from an identifier, so it can't change the requested path. */
export function segment(id: string): string {
	return encodeURIComponent(id);
}
