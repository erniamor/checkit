import {
	type CreateList,
	createListSchema,
	type List,
	listSchema,
	paginatedSchema,
	type UpdateList,
	updateListSchema,
} from "@repo/schemas";
import {
	type Page,
	type PageOptions,
	segment,
	toPage,
	withQuery,
} from "../api/page";
import { type ApiClient, parseInput } from "../http/client";
import { type ListEventHandlers, subscribeToList } from "./list-events";

/** The user's lists. A list the user can't see answers a NotFoundError. */
export function createListsResource(client: ApiClient) {
	return {
		/** The user's lists, newest first, with their role and item counts. */
		async list({
			page,
			pageSize,
			signal,
		}: PageOptions = {}): Promise<Page<List>> {
			return toPage(
				await client.request({
					path: withQuery("/lists", { page, pageSize }),
					response: paginatedSchema(listSchema),
					signal,
				}),
			);
		},

		async get(
			listId: string,
			options: { signal?: AbortSignal } = {},
		): Promise<List> {
			return client.request({
				path: `/lists/${segment(listId)}`,
				response: listSchema,
				signal: options.signal,
			});
		},

		async create(input: CreateList): Promise<List> {
			return client.request({
				method: "POST",
				path: "/lists",
				body: parseInput(createListSchema, input),
				response: listSchema,
			});
		},

		/** Renames the list and/or changes its kind. */
		async update(listId: string, input: UpdateList): Promise<List> {
			return client.request({
				method: "PATCH",
				path: `/lists/${segment(listId)}`,
				body: parseInput(updateListSchema, input),
				response: listSchema,
			});
		},

		/** Deletes the list for all its members (owner only). */
		async remove(listId: string): Promise<void> {
			await client.request({
				method: "DELETE",
				path: `/lists/${segment(listId)}`,
			});
		},

		/**
		 * Listens to the list's changes in real time (browser only). Returns the
		 * function that stops listening.
		 */
		subscribe(listId: string, handlers: ListEventHandlers): () => void {
			return subscribeToList(client, listId, handlers);
		},
	};
}

export type ListsResource = ReturnType<typeof createListsResource>;
