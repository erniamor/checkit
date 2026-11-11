import {
	type CreateShareLink,
	createShareLinkSchema,
	type List,
	listSchema,
	paginatedSchema,
	type ShareLink,
	type ShareLinkPreview,
	shareLinkPreviewSchema,
	shareLinkSchema,
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
 * Share links: at most one active link per role. Managing them is reserved to
 * the list's owner; anyone with the token previews and joins the list.
 */
export function createShareLinksResource(client: ApiClient) {
	const linksPath = (listId: string) => `/lists/${segment(listId)}/share-links`;

	return {
		/** Active links of the list. */
		async list(
			listId: string,
			{ page, pageSize, signal }: PageOptions = {},
		): Promise<Page<ShareLink>> {
			return toPage(
				await client.request({
					path: withQuery(linksPath(listId), { page, pageSize }),
					response: paginatedSchema(shareLinkSchema),
					signal,
				}),
			);
		},

		/** Creates the link for a role, revoking the previous one for that role. */
		async create(listId: string, input: CreateShareLink): Promise<ShareLink> {
			return client.request({
				method: "POST",
				path: linksPath(listId),
				body: parseInput(createShareLinkSchema, input),
				response: shareLinkSchema,
			});
		},

		async revoke(listId: string, linkId: string): Promise<void> {
			await client.request({
				method: "DELETE",
				path: `${linksPath(listId)}/${segment(linkId)}`,
			});
		},

		/**
		 * What the link shows, without a session. A revoked link is an ApiError
		 * with the status 410.
		 */
		async preview(
			token: string,
			options: { signal?: AbortSignal } = {},
		): Promise<ShareLinkPreview> {
			return client.request({
				path: `/share-links/${segment(token)}`,
				response: shareLinkPreviewSchema,
				signal: options.signal,
			});
		},

		/** Joins the list as the signed-in user; returns the list. */
		async join(token: string): Promise<List> {
			return client.request({
				method: "POST",
				path: `/share-links/${segment(token)}/join`,
				response: listSchema,
			});
		},
	};
}

export type ShareLinksResource = ReturnType<typeof createShareLinksResource>;
