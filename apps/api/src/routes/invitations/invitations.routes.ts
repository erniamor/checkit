import { createInvitationSchema } from "@repo/schemas";
import { Hono } from "hono";
import { z } from "zod";
import { resolveLocale } from "@/lib/locale";
import { paginationQuerySchema } from "@/lib/pagination";
import { tokenParamSchema } from "@/lib/tokens";
import { validate } from "@/lib/validator";
import { type AuthVariables, requireAuth } from "@/middlewares/require-auth";
import {
	type ListAccessVariables,
	requireListRole,
} from "@/middlewares/require-list-role";
import {
	acceptInvitation,
	acceptReceivedInvitation,
	createInvitation,
	declineInvitation,
	listPendingInvitations,
	listReceivedInvitations,
	MAX_PENDING_INVITATIONS,
	previewInvitation,
	revokeInvitation,
} from "@/routes/invitations/invitations.service";

const invitationsPagination = paginationQuerySchema({
	defaultPageSize: MAX_PENDING_INVITATIONS,
	maxPageSize: MAX_PENDING_INVITATIONS,
});

const invitationParamSchema = z.object({ invitationId: z.uuid() });

// Mounted on /lists/:listId/invitations, behind requireAuth: owner only
export const listInvitationsRoutes = new Hono<{
	Variables: ListAccessVariables;
}>()
	.get(
		"/",
		requireListRole("owner"),
		validate("query", invitationsPagination),
		async (c) =>
			c.json(
				await listPendingInvitations(c.get("listId"), c.req.valid("query")),
			),
	)
	.post(
		"/",
		requireListRole("owner"),
		validate("json", createInvitationSchema),
		async (c) => {
			const { email, role } = c.req.valid("json");
			const invitation = await createInvitation({
				listId: c.get("listId"),
				inviter: c.get("user"),
				email,
				role,
				locale: resolveLocale(c.req.header("Accept-Language")),
			});
			return c.json(invitation, 201);
		},
	)
	.delete(
		"/:invitationId",
		requireListRole("owner"),
		validate("param", invitationParamSchema),
		async (c) => {
			await revokeInvitation(
				c.get("listId"),
				c.req.valid("param").invitationId,
			);
			return c.body(null, 204);
		},
	);

// Mounted on /invitations: the links sent by email
export const invitationsRoutes = new Hono<{ Variables: AuthVariables }>()
	// Public: shown before the invited person signs in
	.get("/:token", validate("param", tokenParamSchema), async (c) =>
		c.json(await previewInvitation(c.req.valid("param").token)),
	)
	.post(
		"/:token/accept",
		requireAuth,
		validate("param", tokenParamSchema),
		async (c) =>
			c.json(await acceptInvitation(c.req.valid("param").token, c.get("user"))),
	);

// Mounted on /me/invitations, behind requireAuth: the invitations sent to the
// signed-in user's email, answered from the app
export const receivedInvitationsRoutes = new Hono<{
	Variables: AuthVariables;
}>()
	.get("/", validate("query", invitationsPagination), async (c) =>
		c.json(await listReceivedInvitations(c.get("user"), c.req.valid("query"))),
	)
	.post(
		"/:invitationId/accept",
		validate("param", invitationParamSchema),
		async (c) =>
			c.json(
				await acceptReceivedInvitation(
					c.req.valid("param").invitationId,
					c.get("user"),
				),
			),
	)
	.delete(
		"/:invitationId",
		validate("param", invitationParamSchema),
		async (c) => {
			await declineInvitation(c.req.valid("param").invitationId, c.get("user"));
			return c.body(null, 204);
		},
	);
