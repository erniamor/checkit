import type { Page } from "@repo/resources";
import type {
	CreateInvitation,
	List,
	Member,
	ShareableRole,
} from "@repo/schemas";
import { toast } from "@repo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { listKeys } from "@/features/lists/queries";
import { getApi } from "@/lib/api";
import { saveErrorMessage } from "@/lib/error-messages";
import { m } from "@/paraglide/messages";

/** The sharing actions of a list: members, invitations, links. */
export function useSharing(listId: string) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const api = getApi();
	const membersKey = listKeys.members(listId);
	const showError = (error: unknown) => toast.error(saveErrorMessage(error));

	function updateMembers(update: (members: Member[]) => Member[]) {
		queryClient.setQueryData<Page<Member>>(membersKey, (page) => {
			if (!page) {
				return page;
			}
			const items = update(page.items);
			return { ...page, items, total: items.length };
		});
	}

	const updateRole = useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: ShareableRole }) =>
			api.members.updateRole(listId, userId, { role }),
		onSuccess: (updated) =>
			updateMembers((members) =>
				members.map((member) =>
					member.userId === updated.userId ? updated : member,
				),
			),
		onError: showError,
	});

	const removeMember = useMutation({
		mutationFn: (userId: string) => api.members.remove(listId, userId),
		onSuccess: (_, userId) =>
			updateMembers((members) =>
				members.filter((member) => member.userId !== userId),
			),
		onError: showError,
	});

	const leave = useMutation({
		mutationFn: () => api.members.leave(listId),
		onSuccess: async () => {
			const name =
				queryClient.getQueryData<List>(listKeys.detail(listId))?.name ?? "";
			toast.success(m.toast_left_list({ name }));
			await navigate({ to: "/lists" });
			queryClient.removeQueries({ queryKey: listKeys.detail(listId) });
			await queryClient.invalidateQueries({ queryKey: listKeys.all });
		},
		onError: showError,
	});

	// Errors are shown in the invitation form
	const invite = useMutation({
		mutationFn: (input: CreateInvitation) =>
			api.invitations.create(listId, input),
		onSuccess: async (invitation) => {
			toast.success(m.toast_invitation_sent({ email: invitation.email }));
			await queryClient.invalidateQueries({
				queryKey: listKeys.invitations(listId),
			});
		},
	});

	const cancelInvitation = useMutation({
		mutationFn: (invitationId: string) =>
			api.invitations.revoke(listId, invitationId),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: listKeys.invitations(listId) }),
		onError: showError,
	});

	const createLink = useMutation({
		mutationFn: (role: ShareableRole) =>
			api.shareLinks.create(listId, { role }),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: listKeys.shareLinks(listId) }),
		onError: showError,
	});

	const revokeLink = useMutation({
		mutationFn: (linkId: string) => api.shareLinks.revoke(listId, linkId),
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: listKeys.shareLinks(listId) }),
		onError: showError,
	});

	return {
		updateRole,
		removeMember,
		leave,
		invite,
		cancelInvitation,
		createLink,
		revokeLink,
	};
}

export type Sharing = ReturnType<typeof useSharing>;
