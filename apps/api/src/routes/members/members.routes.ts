import { updateMemberSchema } from "@repo/schemas";
import { Hono } from "hono";
import { z } from "zod";
import { paginationQuerySchema } from "@/lib/pagination";
import { validate } from "@/lib/validator";
import {
	type ListAccessVariables,
	requireListRole,
} from "@/middlewares/require-list-role";
import {
	leaveList,
	listMembersOf,
	removeMember,
	updateMemberRole,
} from "@/routes/members/members.service";

const membersPagination = paginationQuerySchema({
	defaultPageSize: 50,
	maxPageSize: 100,
});

const memberParamSchema = z.object({ userId: z.uuid() });

// Mounted on /lists/:listId/members, behind requireAuth
export const membersRoutes = new Hono<{ Variables: ListAccessVariables }>()
	.get(
		"/",
		requireListRole("viewer"),
		validate("query", membersPagination),
		async (c) =>
			c.json(await listMembersOf(c.get("listId"), c.req.valid("query"))),
	)
	// Declared before /:userId, which would otherwise match "me"
	.delete("/me", requireListRole("viewer"), async (c) => {
		await leaveList(c.get("listId"), c.get("user").id, c.get("role"));
		return c.body(null, 204);
	})
	.patch(
		"/:userId",
		requireListRole("owner"),
		validate("param", memberParamSchema),
		validate("json", updateMemberSchema),
		async (c) =>
			c.json(
				await updateMemberRole(
					c.get("listId"),
					c.req.valid("param").userId,
					c.req.valid("json").role,
					c.get("user").id,
				),
			),
	)
	.delete(
		"/:userId",
		requireListRole("owner"),
		validate("param", memberParamSchema),
		async (c) => {
			await removeMember(
				c.get("listId"),
				c.req.valid("param").userId,
				c.get("user").id,
			);
			return c.body(null, 204);
		},
	);
