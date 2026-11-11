import { z } from "zod";

/** A path of this app ("/lists"), never another site ("//evil.com", "https://..."). */
export function isInternalPath(value: string): boolean {
	return (
		value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
	);
}

/**
 * The `redirect` search parameter: where to go after signing in. Anything that
 * isn't an internal path is dropped, so it can't send users to another site.
 */
export const redirectSearchSchema = z.object({
	redirect: z.string().refine(isInternalPath).optional().catch(undefined),
});

export type RedirectSearch = z.infer<typeof redirectSearchSchema>;
