import type { CreateList } from "@repo/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { listKeys } from "@/features/lists/queries";
import { getApi } from "@/lib/api";

/** Creates a list, then opens it in place of the creation page. */
export function useCreateList() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: (input: CreateList) => getApi().lists.create(input),
		onSuccess: async (list) => {
			queryClient.setQueryData(listKeys.detail(list.id), list);
			await queryClient.invalidateQueries({
				queryKey: listKeys.all,
				exact: true,
			});
			// Back from the new list goes to "My lists", not to the filled form
			await navigate({
				to: "/lists/$listId",
				params: { listId: list.id },
				replace: true,
			});
		},
	});
}
