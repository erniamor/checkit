import { queryOptions } from "@tanstack/react-query";
import { listKeys } from "@/features/lists/queries";
import { getApi } from "@/lib/api";

// Bounded by the API: 50 pending invitations, one link per role
const MEMBERS_PAGE_SIZE = 100;
const INVITATIONS_PAGE_SIZE = 50;
const SHARE_LINKS_PAGE_SIZE = 10;

export function membersQueryOptions(listId: string) {
	return queryOptions({
		queryKey: listKeys.members(listId),
		queryFn: ({ signal }) =>
			getApi().members.list(listId, { pageSize: MEMBERS_PAGE_SIZE, signal }),
	});
}

/** Pending invitations: owner only. */
export function invitationsQueryOptions(listId: string) {
	return queryOptions({
		queryKey: listKeys.invitations(listId),
		queryFn: ({ signal }) =>
			getApi().invitations.list(listId, {
				pageSize: INVITATIONS_PAGE_SIZE,
				signal,
			}),
	});
}

/** Active share links: owner only. */
export function shareLinksQueryOptions(listId: string) {
	return queryOptions({
		queryKey: listKeys.shareLinks(listId),
		queryFn: ({ signal }) =>
			getApi().shareLinks.list(listId, {
				pageSize: SHARE_LINKS_PAGE_SIZE,
				signal,
			}),
	});
}
