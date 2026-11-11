import { TooltipProvider } from "@repo/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { type ReactNode, Suspense } from "react";

function testQueryClient() {
	return new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
}

/** Renders a component that uses TanStack Query (mutations, queries). */
export function renderWithQueryClient(ui: ReactNode) {
	return render(
		<QueryClientProvider client={testQueryClient()}>
			<TooltipProvider>{ui}</TooltipProvider>
		</QueryClientProvider>,
	);
}

/** Renders a component that uses router features (links, navigation) and TanStack Query. */
export function renderWithRouter(ui: ReactNode) {
	const queryClient = testQueryClient();
	const router = createRouter({
		// Suspense: pages read their data with useSuspenseQuery
		routeTree: createRootRoute({
			component: () => (
				<TooltipProvider>
					<Suspense fallback={<p>Loading</p>}>{ui}</Suspense>
				</TooltipProvider>
			),
		}),
		history: createMemoryHistory(),
		context: { queryClient },
	});
	return {
		router,
		...render(
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>,
		),
	};
}
