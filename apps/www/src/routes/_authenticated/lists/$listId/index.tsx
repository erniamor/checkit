import { createFileRoute } from "@tanstack/react-router";
import { ListPage } from "@/features/lists/ListPage";
import { orListNotFound } from "@/features/lists/or-list-not-found";
import { itemsQueryOptions } from "@/features/lists/queries";

export const Route = createFileRoute("/_authenticated/lists/$listId/")({
	loader: ({ context, params }) =>
		orListNotFound(context.queryClient, params.listId, () =>
			context.queryClient.ensureQueryData(itemsQueryOptions(params.listId)),
		),
	component: ListRoute,
});

function ListRoute() {
	const { listId } = Route.useParams();
	return <ListPage listId={listId} />;
}
