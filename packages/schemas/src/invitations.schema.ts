import { z } from "zod";
import { dateTimeSchema } from "./common";
import { shareableRoleSchema } from "./members.schema";

// Error messages are codes, translated by the front ends.
// trim() and toLowerCase(): emails are compared case-insensitively.
export const invitationEmailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email("email_invalid"));

export const createInvitationSchema = z.strictObject({
	email: invitationEmailSchema,
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
	/** Name of the person who sent the invitation, or their email if they have no name. */
	invitedBy: z.string().nullable(),
	expiresAt: dateTimeSchema,
});

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
