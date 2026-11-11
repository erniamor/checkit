import { NotFoundError } from "@repo/resources";
import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { listKeys } from "@/features/lists/queries";

/**
 * Runs a list page's loader; a 404 (unknown, deleted, or not shared with the
 * user: the API doesn't tell) becomes the "list not found" page.
 */
export async function orListNotFound<T>(
	queryClient: QueryClient,
	listId: string,
	load: () => Promise<T>,
): Promise<T> {
	try {
		return await load();
	} catch (error) {
		if (error instanceof NotFoundError) {
			// Nothing about this list is handed to the browser's cache
			await queryClient.cancelQueries({ queryKey: listKeys.detail(listId) });
			queryClient.removeQueries({ queryKey: listKeys.detail(listId) });
			throw notFound();
		}
		throw error;
	}
}
