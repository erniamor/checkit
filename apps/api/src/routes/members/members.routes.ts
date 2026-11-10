import { Hono } from "hono";
import { paginationQuerySchema } from "@/lib/pagination";
import { validate } from "@/lib/validator";
import {
	type ListAccessVariables,
	requireListRole,
} from "@/middlewares/require-list-role";
import { listMembersOf } from "@/routes/members/members.service";

const membersPagination = paginationQuerySchema({
	defaultPageSize: 50,
	maxPageSize: 100,
});

// Mounted on /lists/:listId/members, behind requireAuth
export const membersRoutes = new Hono<{
	Variables: ListAccessVariables;
}>().get(
	"/",
	requireListRole("viewer"),
	validate("query", membersPagination),
	async (c) =>
		c.json(await listMembersOf(c.get("listId"), c.req.valid("query"))),
);
