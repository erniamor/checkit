import { UnauthorizedError } from "@repo/resources";
import type { Profile } from "@repo/schemas";
import { queryOptions } from "@tanstack/react-query";
import { getApi } from "@/lib/api";

export const meQueryKey = ["me"] as const;

/** The signed-in user, or null for a visitor. */
export function meQueryOptions() {
	return queryOptions({
		queryKey: meQueryKey,
		queryFn: async ({ signal }): Promise<Profile | null> => {
			try {
				return await getApi().me.get({ signal });
			} catch (error) {
				if (error instanceof UnauthorizedError) {
					return null;
				}
				throw error;
			}
		},
		staleTime: 5 * 60_000,
	});
}
