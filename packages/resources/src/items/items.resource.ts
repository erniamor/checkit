import {
	type CreateItem,
	type CreateItemsBatch,
	createItemSchema,
	createItemsBatchSchema,
	type Item,
	itemSchema,
	paginatedSchema,
	type UpdateAllItems,
	type UpdateItem,
	updateAllItemsSchema,
	updateItemSchema,
} from "@repo/schemas";
import { z } from "zod";
import {
	type Page,
	type PageOptions,
	segment,
	toPage,
	withQuery,
} from "../api/page";
import { type ApiClient, parseInput } from "../http/client";

const itemsResponseSchema = z.object({ data: z.array(itemSchema) });

/** The items of a list. */
export function createItemsResource(client: ApiClient) {
	const itemsPath = (listId: string) => `/lists/${segment(listId)}/items`;
	const itemPath = (listId: string, itemId: string) =>
		`${itemsPath(listId)}/${segment(itemId)}`;

	return {
		/** The list's items, in display order. */
		async list(
			listId: string,
			{ page, pageSize, signal }: PageOptions = {},
		): Promise<Page<Item>> {
			return toPage(
				await client.request({
					path: withQuery(itemsPath(listId), { page, pageSize }),
					response: paginatedSchema(itemSchema),
					signal,
				}),
			);
		},

		/** Adds an item at the end of the list. */
		async add(listId: string, input: CreateItem): Promise<Item> {
			return client.request({
				method: "POST",
				path: itemsPath(listId),
				body: parseInput(createItemSchema, input),
				response: itemSchema,
			});
		},

		/** Adds several items at once, in order (e.g. from a voice input). */
		async addMany(listId: string, input: CreateItemsBatch): Promise<Item[]> {
			const { data } = await client.request({
				method: "POST",
				path: `${itemsPath(listId)}/batch`,
				body: parseInput(createItemsBatchSchema, input),
				response: itemsResponseSchema,
			});
			return data;
		},

		/** Renames, checks or unchecks, or moves an item. */
		async update(
			listId: string,
			itemId: string,
			changes: UpdateItem,
		): Promise<Item> {
			return client.request({
				method: "PATCH",
				path: itemPath(listId, itemId),
				body: parseInput(updateItemSchema, changes),
				response: itemSchema,
			});
		},

		/**
		 * Checks or unchecks every item of the list; returns the items whose
		 * state changed.
		 */
		async updateAll(listId: string, changes: UpdateAllItems): Promise<Item[]> {
			const { data } = await client.request({
				method: "PATCH",
				path: itemsPath(listId),
				body: parseInput(updateAllItemsSchema, changes),
				response: itemsResponseSchema,
			});
			return data;
		},

		async remove(listId: string, itemId: string): Promise<void> {
			await client.request({
				method: "DELETE",
				path: itemPath(listId, itemId),
			});
		},
	};
}

export type ItemsResource = ReturnType<typeof createItemsResource>;
