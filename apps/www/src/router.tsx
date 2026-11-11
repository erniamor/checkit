import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ErrorView } from "@/components/ErrorView";
import { Loading } from "@/components/Loading";
import { NotFound } from "@/components/NotFound";
import { routeTree } from "@/routeTree.gen";

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: 30_000 } },
	});

	const router = createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		// Preloaded data is cached by TanStack Query, not by the router
		defaultPreloadStaleTime: 0,
		defaultErrorComponent: ErrorView,
		defaultNotFoundComponent: NotFound,
		defaultPendingComponent: Loading,
	});
	// Data loaded during server rendering is handed to the browser's cache
	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
