import { createListSchema, updateListSchema } from "@repo/schemas";
import { Hono } from "hono";
import { paginationQuerySchema } from "@/lib/pagination";
import { validate } from "@/lib/validator";
import { requireAuth } from "@/middlewares/require-auth";
import {
	type ListAccessVariables,
	requireListRole,
} from "@/middlewares/require-list-role";
import { listEventsRoutes } from "@/routes/events/events.routes";
import { listInvitationsRoutes } from "@/routes/invitations/invitations.routes";
import { itemsRoutes } from "@/routes/items/items.routes";
import {
	createList,
	deleteList,
	getListOfUser,
	listListsOfUser,
	updateList,
} from "@/routes/lists/lists.service";
import { membersRoutes } from "@/routes/members/members.routes";
import { listShareLinksRoutes } from "@/routes/share-links/share-links.routes";

const listsPagination = paginationQuerySchema({
	defaultPageSize: 50,
	maxPageSize: 100,
});

export const listsRoutes = new Hono<{ Variables: ListAccessVariables }>()
	.use(requireAuth)
	.get("/", validate("query", listsPagination), async (c) =>
		c.json(await listListsOfUser(c.get("user").id, c.req.valid("query"))),
	)
	.post("/", validate("json", createListSchema), async (c) =>
		c.json(await createList(c.get("user").id, c.req.valid("json")), 201),
	)
	.get("/:listId", requireListRole("viewer"), async (c) =>
		c.json(await getListOfUser(c.get("listId"), c.get("user").id)),
	)
	.patch(
		"/:listId",
		requireListRole("editor"),
		validate("json", updateListSchema),
		async (c) =>
			c.json(
				await updateList(
					c.get("listId"),
					c.get("user").id,
					c.req.valid("json"),
				),
			),
	)
	.delete("/:listId", requireListRole("owner"), async (c) => {
		await deleteList(c.get("listId"), c.get("user").id);
		return c.body(null, 204);
	})
	.route("/:listId/items", itemsRoutes)
	.route("/:listId/members", membersRoutes)
	.route("/:listId/invitations", listInvitationsRoutes)
	.route("/:listId/share-links", listShareLinksRoutes)
	.route("/:listId/events", listEventsRoutes);
