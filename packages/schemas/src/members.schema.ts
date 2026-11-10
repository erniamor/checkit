import { z } from "zod";
import { dateTimeSchema } from "./common";

/** Roles on a list, from the most to the least privileged. */
export const memberRoles = ["owner", "editor", "viewer"] as const;

export const memberRoleSchema = z.enum(memberRoles);

export type MemberRole = z.infer<typeof memberRoleSchema>;

export const memberSchema = z.object({
	userId: z.uuid(),
	name: z.string(),
	email: z.email(),
	image: z.string().nullable(),
	role: memberRoleSchema,
	joinedAt: dateTimeSchema,
});

export type Member = z.infer<typeof memberSchema>;
