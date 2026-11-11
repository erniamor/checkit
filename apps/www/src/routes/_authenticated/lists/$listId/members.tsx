import { createFileRoute } from "@tanstack/react-router";
import { orListNotFound } from "@/features/lists/or-list-not-found";
import { isOwner } from "@/features/lists/permissions";
import { listQueryOptions } from "@/features/lists/queries";
import { MembersPage } from "@/features/sharing/MembersPage";
import {
	invitationsQueryOptions,
	membersQueryOptions,
	shareLinksQueryOptions,
} from "@/features/sharing/queries";

export const Route = createFileRoute("/_authenticated/lists/$listId/members")({
	loader: ({ context: { queryClient }, params: { listId } }) =>
		orListNotFound(queryClient, listId, async () => {
			const [list] = await Promise.all([
				queryClient.ensureQueryData(listQueryOptions(listId)),
				queryClient.ensureQueryData(membersQueryOptions(listId)),
			]);
			// Invitations and links are only shown, and only readable, by the owner
			if (isOwner(list.role)) {
				await Promise.all([
					queryClient.ensureQueryData(invitationsQueryOptions(listId)),
					queryClient.ensureQueryData(shareLinksQueryOptions(listId)),
				]);
			}
		}),
	component: MembersRoute,
});

function MembersRoute() {
	const { listId } = Route.useParams();
	const { me } = Route.useRouteContext();
	return <MembersPage listId={listId} meId={me.id} />;
}
