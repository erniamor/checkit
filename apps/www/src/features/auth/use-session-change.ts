import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { meQueryKey, meQueryOptions } from "@/features/auth/me-query";

/**
 * After signing in, out or updating the profile: reloads the current user,
 * re-runs the routes' checks (redirects, header) and opens `href`.
 */
export function useSessionChange() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return {
		async refresh(href: string) {
			await queryClient.fetchQuery({ ...meQueryOptions(), staleTime: 0 });
			await router.invalidate();
			await router.navigate({ href });
		},
		async clear(href: string) {
			queryClient.setQueryData(meQueryKey, null);
			await router.invalidate();
			await router.navigate({ href });
		},
	};
}
