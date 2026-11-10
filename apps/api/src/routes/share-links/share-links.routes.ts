import { createShareLinkSchema } from "@repo/schemas";
import { Hono } from "hono";
import { z } from "zod";
import { paginationQuerySchema } from "@/lib/pagination";
import { tokenParamSchema } from "@/lib/tokens";
import { validate } from "@/lib/validator";
import { type AuthVariables, requireAuth } from "@/middlewares/require-auth";
import {
	type ListAccessVariables,
	requireListRole,
} from "@/middlewares/require-list-role";
import {
	createShareLink,
	joinWithShareLink,
	listActiveShareLinks,
	previewShareLink,
	revokeShareLink,
} from "@/routes/share-links/share-links.service";

// At most one active link per shareable role
const shareLinksPagination = paginationQuerySchema({
	defaultPageSize: 10,
	maxPageSize: 10,
});

const shareLinkParamSchema = z.object({ linkId: z.uuid() });

// Mounted on /lists/:listId/share-links, behind requireAuth: owner only
export const listShareLinksRoutes = new Hono<{
	Variables: ListAccessVariables;
}>()
	.get(
		"/",
		requireListRole("owner"),
		validate("query", shareLinksPagination),
		async (c) =>
			c.json(await listActiveShareLinks(c.get("listId"), c.req.valid("query"))),
	)
	.post(
		"/",
		requireListRole("owner"),
		validate("json", createShareLinkSchema),
		async (c) =>
			c.json(
				await createShareLink(
					c.get("listId"),
					c.get("user").id,
					c.req.valid("json").role,
				),
				201,
			),
	)
	.delete(
		"/:linkId",
		requireListRole("owner"),
		validate("param", shareLinkParamSchema),
		async (c) => {
			await revokeShareLink(c.get("listId"), c.req.valid("param").linkId);
			return c.body(null, 204);
		},
	);

// Mounted on /share-links: the links shared by owners
export const shareLinksRoutes = new Hono<{ Variables: AuthVariables }>()
	// Public: shown before the person signs in
	.get("/:token", validate("param", tokenParamSchema), async (c) =>
		c.json(await previewShareLink(c.req.valid("param").token)),
	)
	.post(
		"/:token/join",
		requireAuth,
		validate("param", tokenParamSchema),
		async (c) =>
			c.json(
				await joinWithShareLink(c.req.valid("param").token, c.get("user").id),
			),
	);
