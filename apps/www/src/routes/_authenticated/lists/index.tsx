import { createFileRoute } from "@tanstack/react-router";
import { ListsPage } from "@/features/lists/ListsPage";
import { listsQueryOptions } from "@/features/lists/queries";

export const Route = createFileRoute("/_authenticated/lists/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(listsQueryOptions()),
	component: ListsPage,
});
