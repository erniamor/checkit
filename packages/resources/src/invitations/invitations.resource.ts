import {
	type CreateInvitation,
	createInvitationSchema,
	type Invitation,
	type InvitationPreview,
	invitationPreviewSchema,
	invitationSchema,
	type List,
	listSchema,
	paginatedSchema,
} from "@repo/schemas";
import {
	type Page,
	type PageOptions,
	segment,
	toPage,
	withQuery,
} from "../api/page";
import { type ApiClient, parseInput } from "../http/client";

/**
 * Invitations by email. Managing them is reserved to the list's owner; the
 * invited person previews and accepts them through the token of their link.
 */
export function createInvitationsResource(client: ApiClient) {
	const invitationsPath = (listId: string) =>
		`/lists/${segment(listId)}/invitations`;

	return {
		/** Pending invitations of the list. */
		async list(
			listId: string,
			{ page, pageSize, signal }: PageOptions = {},
		): Promise<Page<Invitation>> {
			return toPage(
				await client.request({
					path: withQuery(invitationsPath(listId), { page, pageSize }),
					response: paginatedSchema(invitationSchema),
					signal,
				}),
			);
		},

		/** Emails an invitation; inviting the same email again replaces it. */
		async create(listId: string, input: CreateInvitation): Promise<Invitation> {
			return client.request({
				method: "POST",
				path: invitationsPath(listId),
				body: parseInput(createInvitationSchema, input),
				response: invitationSchema,
			});
		},

		async revoke(listId: string, invitationId: string): Promise<void> {
			await client.request({
				method: "DELETE",
				path: `${invitationsPath(listId)}/${segment(invitationId)}`,
			});
		},

		/**
		 * What the invitation link shows, without a session. An expired or used
		 * invitation is an ApiError with the status 410.
		 */
		async preview(
			token: string,
			options: { signal?: AbortSignal } = {},
		): Promise<InvitationPreview> {
			return client.request({
				path: `/invitations/${segment(token)}`,
				response: invitationPreviewSchema,
				signal: options.signal,
			});
		},

		/** Accepts the invitation for the signed-in user; returns the list. */
		async accept(token: string): Promise<List> {
			return client.request({
				method: "POST",
				path: `/invitations/${segment(token)}/accept`,
				response: listSchema,
			});
		},
	};
}

export type InvitationsResource = ReturnType<typeof createInvitationsResource>;
