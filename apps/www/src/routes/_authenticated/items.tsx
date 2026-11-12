import { itemsFilterSchema } from "@repo/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AllItemsPage } from "@/features/items/AllItemsPage";
import { allItemsQueryOptions } from "@/features/lists/queries";

// An unknown status in the URL falls back to the items to do
const itemsSearchSchema = z.object({
	status: itemsFilterSchema.shape.status.catch("open"),
});

export const Route = createFileRoute("/_authenticated/items")({
	validateSearch: itemsSearchSchema,
	loaderDeps: ({ search }) => ({ status: search.status }),
	loader: ({ context, deps }) =>
		context.queryClient.ensureQueryData(allItemsQueryOptions(deps.status)),
	component: ItemsRoute,
});

function ItemsRoute() {
	const { status } = Route.useSearch();
	const navigate = Route.useNavigate();

	return (
		<AllItemsPage
			status={status}
			onStatusChange={(next) => navigate({ search: { status: next } })}
		/>
	);
}
