import { z } from "zod";
import { dateTimeSchema } from "./common";

/** Roles on a list, from the most to the least privileged. */
export const memberRoles = ["owner", "editor", "viewer"] as const;

export const memberRoleSchema = z.enum(memberRoles);

export type MemberRole = z.infer<typeof memberRoleSchema>;

/** Roles that can be granted by sharing: a list has a single owner. */
export const shareableRoleSchema = memberRoleSchema.exclude(["owner"]);

export type ShareableRole = z.infer<typeof shareableRoleSchema>;

export const updateMemberSchema = z.strictObject({ role: shareableRoleSchema });

export type UpdateMember = z.infer<typeof updateMemberSchema>;

export const memberSchema = z.object({
	userId: z.uuid(),
	name: z.string(),
	email: z.email(),
	image: z.string().nullable(),
	role: memberRoleSchema,
	joinedAt: dateTimeSchema,
});

export type Member = z.infer<typeof memberSchema>;
