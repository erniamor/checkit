import {
	type CreateItem,
	type CreateItemsBatch,
	createItemSchema,
	createItemsBatchSchema,
	type Item,
	type ItemStatus,
	type ItemWithList,
	itemSchema,
	itemsBatchResultSchema,
	itemWithListSchema,
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

		/**
		 * The user's items across all their lists, grouped by list; the items
		 * still to do unless another status is asked for.
		 */
		async listAll({
			status,
			page,
			pageSize,
			signal,
		}: PageOptions & { status?: ItemStatus } = {}): Promise<
			Page<ItemWithList>
		> {
			return toPage(
				await client.request({
					path: withQuery("/items", { status, page, pageSize }),
					response: paginatedSchema(itemWithListSchema),
					signal,
				}),
			);
		},

		/**
		 * Adds an item at the end of the list; a checked item with the same
		 * label is unchecked and returned instead. A label among the items to do
		 * is refused (409, `item_label_taken`).
		 */
		async add(listId: string, input: CreateItem): Promise<Item> {
			return client.request({
				method: "POST",
				path: itemsPath(listId),
				body: parseInput(createItemSchema, input),
				response: itemSchema,
			});
		},

		/**
		 * Adds several items at once, in order (e.g. from a voice input). Labels
		 * the list already has aren't duplicated: checked items are unchecked
		 * (`restored`), the others left out (`skipped`).
		 */
		async addMany(
			listId: string,
			input: CreateItemsBatch,
		): Promise<{ created: Item[]; restored: Item[]; skipped: string[] }> {
			const { data, restored, skipped } = await client.request({
				method: "POST",
				path: `${itemsPath(listId)}/batch`,
				body: parseInput(createItemsBatchSchema, input),
				response: itemsBatchResultSchema,
			});
			return { created: data, restored, skipped };
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
