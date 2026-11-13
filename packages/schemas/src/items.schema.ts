import { z } from "zod";
import { dateTimeSchema } from "./common";
import { listKindSchema } from "./lists.schema";
import { memberRoleSchema } from "./members.schema";

export const ITEM_LABEL_MAX_LENGTH = 200;
export const ITEMS_BATCH_MAX_SIZE = 50;

// Error messages are codes, translated by the front ends.
// trim(): a label made only of spaces counts as empty.
export const itemLabelSchema = z
	.string()
	.trim()
	.min(1, "item_label_required")
	.max(ITEM_LABEL_MAX_LENGTH, "item_label_too_long");

/**
 * The form of a label that tells duplicates apart: two items of a list can't
 * have the same. Case and extra spaces don't count; accents do.
 */
export function normalizeItemLabel(label: string): string {
	return label.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Error code of a label already used by another item of the list. */
export const ITEM_LABEL_TAKEN = "item_label_taken";

export const createItemSchema = z.strictObject({ label: itemLabelSchema });

export type CreateItem = z.infer<typeof createItemSchema>;

/** Several items at once, e.g. from a voice input. */
export const createItemsBatchSchema = z.strictObject({
	labels: z
		.array(itemLabelSchema)
		.min(1, "items_required")
		.max(ITEMS_BATCH_MAX_SIZE, "too_many_items"),
});

export type CreateItemsBatch = z.infer<typeof createItemsBatchSchema>;

export const updateItemSchema = z
	.strictObject({
		label: itemLabelSchema.optional(),
		done: z.boolean().optional(),
		/** Any number: to move an item, use a value between its new neighbors' positions. */
		position: z.number().finite().optional(),
	})
	.refine(
		(input) =>
			input.label !== undefined ||
			input.done !== undefined ||
			input.position !== undefined,
		"nothing_to_update",
	);

export type UpdateItem = z.infer<typeof updateItemSchema>;

/** Checks or unchecks every item of a list at once. */
export const updateAllItemsSchema = z.strictObject({ done: z.boolean() });

export type UpdateAllItems = z.infer<typeof updateAllItemsSchema>;

export const itemSchema = z.object({
	id: z.uuid(),
	listId: z.uuid(),
	label: z.string(),
	done: z.boolean(),
	doneAt: dateTimeSchema.nullable(),
	doneById: z.uuid().nullable(),
	position: z.number(),
	createdById: z.uuid().nullable(),
	createdAt: dateTimeSchema,
	updatedAt: dateTimeSchema,
});

export type Item = z.infer<typeof itemSchema>;

/**
 * Response of a batch addition: the items added (`data`); the checked items
 * whose label came again, unchecked instead (`restored`); the labels left out,
 * already among the items to do or repeated in the batch (`skipped`).
 */
export const itemsBatchResultSchema = z.object({
	data: z.array(itemSchema),
	restored: z.array(itemSchema),
	skipped: z.array(z.string()),
});

export type ItemsBatchResult = z.infer<typeof itemsBatchResultSchema>;

/** Which items to show: still to do, checked, or both. */
export const itemStatuses = ["open", "checked", "all"] as const;

export const itemStatusSchema = z.enum(itemStatuses);

export type ItemStatus = z.infer<typeof itemStatusSchema>;

/** Filter of the user's items across all their lists; items to do by default. */
export const itemsFilterSchema = z.object({
	status: itemStatusSchema.default("open"),
});

export type ItemsFilter = z.infer<typeof itemsFilterSchema>;

/** An item, with the list it belongs to and the user's role on that list. */
export const itemWithListSchema = itemSchema.extend({
	list: z.object({
		id: z.uuid(),
		name: z.string(),
		kind: listKindSchema,
		role: memberRoleSchema,
	}),
});

export type ItemWithList = z.infer<typeof itemWithListSchema>;
