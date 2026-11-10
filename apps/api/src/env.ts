import { z } from "zod";

const envSchema = z
	.object({
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		PORT: z.coerce.number().int().min(1).max(65535).default(3001),
		// Public URL of this API, used to build sign-in links and OAuth callbacks
		API_URL: z.url(),
		DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
		BETTER_AUTH_SECRET: z
			.string()
			.min(32, "BETTER_AUTH_SECRET must be at least 32 characters long"),
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
		// Comma-separated list in the environment, turned into an array of origins
		CORS_ORIGINS: z
			.string()
			.transform((value) =>
				value
					.split(",")
					.map((origin) => origin.trim())
					.filter(Boolean),
			)
			.pipe(z.array(z.url()).min(1)),
	})
	.refine(
		(env) =>
			(env.GOOGLE_CLIENT_ID === undefined) ===
			(env.GOOGLE_CLIENT_SECRET === undefined),
		{
			message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together",
			path: ["GOOGLE_CLIENT_SECRET"],
		},
	);

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
	const result = envSchema.safeParse(source);
	if (!result.success) {
		throw new Error(
			`Invalid environment variables:\n${z.prettifyError(result.error)}`,
		);
	}
	return result.data;
}

export const env = parseEnv(process.env);
