import {
	createItemSchema,
	createItemsBatchSchema,
	updateItemSchema,
} from "@repo/schemas";
import { Hono } from "hono";
import { z } from "zod";
import { paginationQuerySchema } from "@/lib/pagination";
import { validate } from "@/lib/validator";
import {
	type ListAccessVariables,
	requireListRole,
} from "@/middlewares/require-list-role";
import {
	addItems,
	deleteItem,
	listItems,
	updateItem,
} from "@/routes/items/items.service";

const itemsPagination = paginationQuerySchema({
	defaultPageSize: 100,
	maxPageSize: 200,
});

const itemParamSchema = z.object({ itemId: z.uuid() });

// Mounted on /lists/:listId/items, behind requireAuth
export const itemsRoutes = new Hono<{ Variables: ListAccessVariables }>()
	.get(
		"/",
		requireListRole("viewer"),
		validate("query", itemsPagination),
		async (c) => c.json(await listItems(c.get("listId"), c.req.valid("query"))),
	)
	.post(
		"/",
		requireListRole("editor"),
		validate("json", createItemSchema),
		async (c) => {
			const [item] = await addItems(c.get("listId"), c.get("user").id, [
				c.req.valid("json").label,
			]);
			return c.json(item, 201);
		},
	)
	.post(
		"/batch",
		requireListRole("editor"),
		validate("json", createItemsBatchSchema),
		async (c) => {
			const created = await addItems(
				c.get("listId"),
				c.get("user").id,
				c.req.valid("json").labels,
			);
			return c.json({ data: created }, 201);
		},
	)
	.patch(
		"/:itemId",
		requireListRole("editor"),
		validate("param", itemParamSchema),
		validate("json", updateItemSchema),
		async (c) =>
			c.json(
				await updateItem(
					c.get("listId"),
					c.req.valid("param").itemId,
					c.get("user").id,
					c.req.valid("json"),
				),
			),
	)
	.delete(
		"/:itemId",
		requireListRole("editor"),
		validate("param", itemParamSchema),
		async (c) => {
			await deleteItem(c.get("listId"), c.req.valid("param").itemId);
			return c.body(null, 204);
		},
	);
