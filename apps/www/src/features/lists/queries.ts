import { queryOptions } from "@tanstack/react-query";
import { getApi } from "@/lib/api";

// One page is enough for short lists: no "load more" for now
export const LISTS_PAGE_SIZE = 100;
export const ITEMS_PAGE_SIZE = 200;

export const listKeys = {
	all: ["lists"] as const,
	detail: (listId: string) => ["lists", listId] as const,
	items: (listId: string) => ["lists", listId, "items"] as const,
	members: (listId: string) => ["lists", listId, "members"] as const,
	invitations: (listId: string) => ["lists", listId, "invitations"] as const,
	shareLinks: (listId: string) => ["lists", listId, "share-links"] as const,
};

/** The user's lists. */
export function listsQueryOptions() {
	return queryOptions({
		queryKey: listKeys.all,
		queryFn: ({ signal }) =>
			getApi().lists.list({ pageSize: LISTS_PAGE_SIZE, signal }),
	});
}

export function listQueryOptions(listId: string) {
	return queryOptions({
		queryKey: listKeys.detail(listId),
		queryFn: ({ signal }) => getApi().lists.get(listId, { signal }),
	});
}

export function itemsQueryOptions(listId: string) {
	return queryOptions({
		queryKey: listKeys.items(listId),
		queryFn: ({ signal }) =>
			getApi().items.list(listId, { pageSize: ITEMS_PAGE_SIZE, signal }),
	});
}
