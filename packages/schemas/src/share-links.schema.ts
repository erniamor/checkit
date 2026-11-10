import { z } from "zod";
import { dateTimeSchema } from "./common";
import { shareableRoleSchema } from "./members.schema";

export const createShareLinkSchema = z.strictObject({
	role: shareableRoleSchema,
});

export type CreateShareLink = z.infer<typeof createShareLinkSchema>;

/** An active share link, as seen by the list's owner. */
export const shareLinkSchema = z.object({
	id: z.uuid(),
	listId: z.uuid(),
	role: shareableRoleSchema,
	/** The front end builds the link to share from this token. */
	token: z.string(),
	createdAt: dateTimeSchema,
});

export type ShareLink = z.infer<typeof shareLinkSchema>;

/** What the share link shows before the person signs in. */
export const shareLinkPreviewSchema = z.object({
	listId: z.uuid(),
	listName: z.string(),
	role: shareableRoleSchema,
	/**
	 * Name of the list's owner, null if they have none. Never their email: the
	 * preview is public, and a share link can end up anywhere.
	 */
	owner: z.string().nullable(),
});

export type ShareLinkPreview = z.infer<typeof shareLinkPreviewSchema>;
