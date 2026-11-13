import { z } from "zod";
import { dateTimeSchema } from "./common";
import { memberRoleSchema } from "./members.schema";

export const LIST_NAME_MAX_LENGTH = 100;

// Error messages are codes, translated by the front ends.
// trim(): a name made only of spaces counts as empty.
export const listNameSchema = z
	.string()
	.trim()
	.min(1, "list_name_required")
	.max(LIST_NAME_MAX_LENGTH, "list_name_too_long");

/** Purchases are said several at once; tasks one at a time. */
export const listKinds = ["purchases", "tasks"] as const;

export const listKindSchema = z.enum(listKinds);

export type ListKind = z.infer<typeof listKindSchema>;

export const createListSchema = z.strictObject({
	name: listNameSchema,
	/** "purchases" when omitted. */
	kind: listKindSchema.optional(),
});

export type CreateList = z.infer<typeof createListSchema>;

export const updateListSchema = z
	.strictObject({
		name: listNameSchema.optional(),
		kind: listKindSchema.optional(),
	})
	.refine(
		(input) => input.name !== undefined || input.kind !== undefined,
		"nothing_to_update",
	);

export type UpdateList = z.infer<typeof updateListSchema>;

export const listSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	kind: listKindSchema,
	/** Role of the current user on the list. */
	role: memberRoleSchema,
	itemCount: z.number().int().min(0),
	doneCount: z.number().int().min(0),
	createdAt: dateTimeSchema,
	updatedAt: dateTimeSchema,
});

export type List = z.infer<typeof listSchema>;
