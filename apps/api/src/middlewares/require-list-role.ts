import type { MemberRole } from "@repo/schemas";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import type { AuthVariables } from "@/middlewares/require-auth";
import {
	findMemberRole,
	hasRoleAtLeast,
} from "@/routes/members/members.service";

export interface ListAccessVariables extends AuthVariables {
	listId: string;
	role: MemberRole;
}

export function listNotFound() {
	return new AppError(404, "list_not_found", "List not found");
}

/**
 * Lets the request through if the signed-in user has at least `minimum` on the
 * `:listId` list. Must run after `requireAuth`. A list the user isn't a member
 * of answers 404, so its existence isn't revealed.
 */
export function requireListRole(minimum: MemberRole) {
	return createMiddleware<{ Variables: ListAccessVariables }>(
		async (c, next) => {
			const listId = z.uuid().safeParse(c.req.param("listId"));
			if (!listId.success) {
				throw listNotFound();
			}

			const role = await findMemberRole(listId.data, c.get("user").id);
			if (!role) {
				throw listNotFound();
			}
			if (!hasRoleAtLeast(role, minimum)) {
				throw new AppError(
					403,
					"forbidden",
					"Your role on this list doesn't allow this action",
				);
			}

			c.set("listId", listId.data);
			c.set("role", role);
			await next();
		},
	);
}
