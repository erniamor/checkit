import { z } from "zod";

// Variables exposed to the browser: only VITE_* ones, never a secret
const publicEnvSchema = z.object({
	VITE_API_URL: z.url(),
	// Shows the theme menu outside development, e.g. on staging
	VITE_THEME_SWITCHER: z.enum(["true", "false"]).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let publicEnv: PublicEnv | undefined;

/** Public environment variables, validated on first use. */
export function getPublicEnv(): PublicEnv {
	if (!publicEnv) {
		const result = publicEnvSchema.safeParse(import.meta.env);
		if (!result.success) {
			throw new Error(
				`Invalid environment variables (see apps/www/.env.example):\n${z.prettifyError(result.error)}`,
			);
		}
		publicEnv = result.data;
	}
	return publicEnv;
}
