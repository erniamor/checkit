import { z } from "zod";
import { dateTimeSchema, emailSchema } from "./common";
import { shareableRoleSchema } from "./members.schema";

export const createInvitationSchema = z.strictObject({
	email: emailSchema,
	role: shareableRoleSchema,
});

export type CreateInvitation = z.infer<typeof createInvitationSchema>;

/** A pending invitation, as seen by the list's owner. */
export const invitationSchema = z.object({
	id: z.uuid(),
	listId: z.uuid(),
	email: z.email(),
	role: shareableRoleSchema,
	invitedById: z.uuid().nullable(),
	expiresAt: dateTimeSchema,
	createdAt: dateTimeSchema,
});

export type Invitation = z.infer<typeof invitationSchema>;

/** What the invitation link shows before the invited person signs in. */
export const invitationPreviewSchema = z.object({
	listId: z.uuid(),
	listName: z.string(),
	role: shareableRoleSchema,
	email: z.email(),
	/**
	 * Name of the person who sent the invitation, null if they have none or
	 * deleted their account. Never their email: the preview is public.
	 */
	invitedBy: z.string().nullable(),
	expiresAt: dateTimeSchema,
});

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;

/**
 * A pending invitation, as seen by the invited user once signed in: accepted
 * or declined from the app, without the email's link.
 */
export const receivedInvitationSchema = z.object({
	id: z.uuid(),
	listId: z.uuid(),
	listName: z.string(),
	role: shareableRoleSchema,
	/** Name of the person who sent it, null if they have none or deleted their account. */
	invitedBy: z.string().nullable(),
	expiresAt: dateTimeSchema,
	createdAt: dateTimeSchema,
});

export type ReceivedInvitation = z.infer<typeof receivedInvitationSchema>;
