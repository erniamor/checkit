import type { Page } from "@repo/resources";
import type { ItemStatus, ItemWithList } from "@repo/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listKeys } from "@/features/lists/queries";
import { getApi } from "@/lib/api";

interface CheckItem {
	item: ItemWithList;
	done: boolean;
}

/**
 * Checks or unchecks an item from the page of all items. Optimistic: the item
 * changes at once, rolled back if the API refuses, then everything is reloaded.
 */
export function useCheckItem(
	status: ItemStatus,
	onError: (error: unknown) => void,
) {
	const queryClient = useQueryClient();
	const api = getApi();
	const key = listKeys.allItems(status);

	return useMutation({
		mutationFn: ({ item, done }: CheckItem) =>
			api.items.update(item.list.id, item.id, { done }),
		onMutate: async ({ item, done }: CheckItem) => {
			await queryClient.cancelQueries({ queryKey: key });
			const previous = queryClient.getQueryData<Page<ItemWithList>>(key);
			if (previous) {
				queryClient.setQueryData<Page<ItemWithList>>(key, {
					...previous,
					items: previous.items.map((other) =>
						other.id === item.id ? { ...other, done } : other,
					),
				});
			}
			return { rollback: () => queryClient.setQueryData(key, previous) };
		},
		onError: (error, _, context) => {
			context?.rollback();
			onError(error);
		},
		// Reloads this page, the lists' counts and the lists' items
		onSettled: () => queryClient.invalidateQueries({ queryKey: listKeys.all }),
	});
}
