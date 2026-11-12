import { ApiError, NotFoundError } from "@repo/resources";
import type { ReceivedInvitation } from "@repo/schemas";
import { toast } from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { listKeys } from "@/features/lists/queries";
import {
	receivedInvitationsKey,
	receivedInvitationsQueryOptions,
} from "@/features/sharing/queries";
import { getApi } from "@/lib/api";
import { formErrors } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

/** Expired, already used, declined elsewhere or canceled by the owner. */
function isGone(error: unknown): boolean {
	return (
		error instanceof NotFoundError ||
		(error instanceof ApiError && error.status === 410)
	);
}

/**
 * The invitations sent to the signed-in user, answered from the app. Each
 * answer is confirmed with a toast; the invitations and lists are reloaded.
 */
export function useReceivedInvitations(userId: string) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const query = useQuery(receivedInvitationsQueryOptions(userId));

	const reload = () =>
		Promise.all([
			queryClient.invalidateQueries({
				queryKey: receivedInvitationsKey(userId),
			}),
			queryClient.invalidateQueries({ queryKey: listKeys.all }),
		]);
	const showError = (error: unknown) =>
		toast.error(
			isGone(error)
				? m.invitation_expired_title()
				: (formErrors(error).form ?? m.error_generic()),
		);

	const accept = useMutation({
		mutationFn: (invitation: ReceivedInvitation) =>
			getApi().invitations.acceptReceived(invitation.id),
		onSuccess: (list) => {
			toast.success(m.toast_invitation_accepted({ list: list.name }), {
				action: {
					label: m.open_list_button(),
					onClick: () =>
						navigate({ to: "/lists/$listId", params: { listId: list.id } }),
				},
			});
		},
		onError: showError,
		onSettled: reload,
	});

	const decline = useMutation({
		mutationFn: (invitation: ReceivedInvitation) =>
			getApi().invitations.decline(invitation.id),
		onSuccess: (_, invitation) => {
			toast.success(m.toast_invitation_declined({ list: invitation.listName }));
		},
		onError: showError,
		onSettled: reload,
	});

	return {
		invitations: query.data?.items ?? [],
		accept,
		decline,
		/** The invitation being answered, to disable its buttons meanwhile. */
		pendingId: accept.isPending
			? accept.variables.id
			: decline.isPending
				? decline.variables.id
				: undefined,
	};
}
