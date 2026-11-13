import { z } from "zod";
import { dateTimeSchema } from "./common";
import { itemSchema } from "./items.schema";
import { listKindSchema } from "./lists.schema";
import { memberSchema } from "./members.schema";

/** SSE event sent first on every connection: the stream is listening. */
export const LIST_EVENTS_READY = "ready";

const eventBase = {
	listId: z.uuid(),
	/** User whose action caused the event, so a front end can skip its own changes. */
	actorId: z.uuid(),
};

/**
 * Changes pushed to the members of a list in real time. Each one is sent as an
 * SSE event named after its `type`, with the whole object as JSON data.
 */
export const listEventSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("items.created"),
		...eventBase,
		items: z.array(itemSchema),
	}),
	z.object({ type: z.literal("item.updated"), ...eventBase, item: itemSchema }),
	z.object({
		type: z.literal("items.updated"),
		...eventBase,
		items: z.array(itemSchema),
	}),
	z.object({ type: z.literal("item.deleted"), ...eventBase, itemId: z.uuid() }),
	z.object({
		type: z.literal("list.updated"),
		...eventBase,
		name: z.string(),
		kind: listKindSchema,
		updatedAt: dateTimeSchema,
	}),
	z.object({ type: z.literal("list.deleted"), ...eventBase }),
	z.object({
		type: z.literal("member.added"),
		...eventBase,
		member: memberSchema,
	}),
	z.object({
		type: z.literal("member.updated"),
		...eventBase,
		member: memberSchema,
	}),
	z.object({
		type: z.literal("member.removed"),
		...eventBase,
		userId: z.uuid(),
	}),
]);

export type ListEvent = z.infer<typeof listEventSchema>;

export type ListEventType = ListEvent["type"];
