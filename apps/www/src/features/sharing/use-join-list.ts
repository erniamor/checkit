import type { List } from "@repo/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { listKeys } from "@/features/lists/queries";

/** Joins a list (invitation or share link), then opens it. */
export function useJoinList(join: () => Promise<List>) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: join,
		onSuccess: async (list) => {
			queryClient.setQueryData(listKeys.detail(list.id), list);
			await queryClient.invalidateQueries({
				queryKey: listKeys.all,
				exact: true,
			});
			await navigate({ to: "/lists/$listId", params: { listId: list.id } });
		},
	});
}
