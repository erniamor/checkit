import { NotFoundError } from "@repo/resources";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ListNotFound } from "@/features/lists/ListNotFound";
import { ListPage } from "@/features/lists/ListPage";
import {
	itemsQueryOptions,
	listKeys,
	listQueryOptions,
} from "@/features/lists/queries";

export const Route = createFileRoute("/_authenticated/lists/$listId")({
	loader: async ({ context, params }) => {
		try {
			await Promise.all([
				context.queryClient.ensureQueryData(listQueryOptions(params.listId)),
				context.queryClient.ensureQueryData(itemsQueryOptions(params.listId)),
			]);
		} catch (error) {
			// Unknown, deleted, or not shared with the user: the API doesn't tell
			if (error instanceof NotFoundError) {
				// Nothing about this list is handed to the browser's cache
				await context.queryClient.cancelQueries({
					queryKey: listKeys.detail(params.listId),
				});
				context.queryClient.removeQueries({
					queryKey: listKeys.detail(params.listId),
				});
				throw notFound();
			}
			throw error;
		}
	},
	notFoundComponent: ListNotFound,
	component: ListRoute,
});

function ListRoute() {
	const { listId } = Route.useParams();
	const { me } = Route.useRouteContext();
	return <ListPage listId={listId} meId={me.id} />;
}
