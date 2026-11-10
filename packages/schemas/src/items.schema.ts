import { z } from "zod";
import { dateTimeSchema } from "./common";

export const ITEM_LABEL_MAX_LENGTH = 200;
export const ITEMS_BATCH_MAX_SIZE = 50;

// Error messages are codes, translated by the front ends.
// trim(): a label made only of spaces counts as empty.
export const itemLabelSchema = z
	.string()
	.trim()
	.min(1, "item_label_required")
	.max(ITEM_LABEL_MAX_LENGTH, "item_label_too_long");

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
