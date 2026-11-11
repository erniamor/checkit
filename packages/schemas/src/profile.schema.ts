import { z } from "zod";

export const PROFILE_NAME_MAX_LENGTH = 60;

// Error messages are codes, translated by the front ends.
// trim(): a name made only of spaces counts as empty.
export const profileNameSchema = z
	.string()
	.trim()
	.min(1, "name_required")
	.max(PROFILE_NAME_MAX_LENGTH, "name_too_long");

export const updateProfileSchema = z.strictObject({ name: profileNameSchema });

export type UpdateProfile = z.infer<typeof updateProfileSchema>;

/** The signed-in user. `name` is empty until they choose one. */
export const profileSchema = z.object({
	id: z.uuid(),
	email: z.email(),
	name: z.string(),
	image: z.string().nullable(),
});

export type Profile = z.infer<typeof profileSchema>;
