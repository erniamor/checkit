import { queryOptions } from "@tanstack/react-query";
import { listKeys } from "@/features/lists/queries";
import { getApi } from "@/lib/api";

// Bounded by the API: 50 pending invitations, one link per role
const MEMBERS_PAGE_SIZE = 100;
const INVITATIONS_PAGE_SIZE = 50;
const SHARE_LINKS_PAGE_SIZE = 10;
const RECEIVED_INVITATIONS_PAGE_SIZE = 50;
/** How often the header checks for new invitations, besides on focus. */
const RECEIVED_INVITATIONS_REFRESH_MS = 60_000;

/** Per user, so another account signing in on the device never sees them. */
export const receivedInvitationsKey = (userId: string) =>
	["me", userId, "invitations"] as const;

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

/**
 * Invitations sent to the signed-in user: checked on load, when the tab gets
 * the focus again, and every minute.
 */
export function receivedInvitationsQueryOptions(userId: string) {
	return queryOptions({
		queryKey: receivedInvitationsKey(userId),
		queryFn: ({ signal }) =>
			getApi().invitations.received({
				pageSize: RECEIVED_INVITATIONS_PAGE_SIZE,
				signal,
			}),
		refetchInterval: RECEIVED_INVITATIONS_REFRESH_MS,
	});
}
