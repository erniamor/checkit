import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListLive } from "@/features/lists/ListLive";
import { ListNotFound } from "@/features/lists/ListNotFound";
import { orListNotFound } from "@/features/lists/or-list-not-found";
import { listQueryOptions } from "@/features/lists/queries";

// Layout of a list's pages (items, members): checks that the list exists for
// the user, and keeps the pages up to date in real time
export const Route = createFileRoute("/_authenticated/lists/$listId")({
	loader: ({ context, params }) =>
		orListNotFound(context.queryClient, params.listId, () =>
			context.queryClient.ensureQueryData(listQueryOptions(params.listId)),
		),
	notFoundComponent: ListNotFound,
	component: ListLayout,
});

function ListLayout() {
	const { listId } = Route.useParams();
	const { me } = Route.useRouteContext();

	return (
		<ListLive listId={listId} meId={me.id}>
			<Outlet />
		</ListLive>
	);
}
