import type { Page } from "@repo/resources";
import type { Item, List, UpdateItem } from "@repo/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { resolveAddition } from "@/features/lists/duplicate-label";
import { listKeys } from "@/features/lists/queries";
import { getApi } from "@/lib/api";

/** The item shown while the API creates it; replaced by the real one after. */
function pendingItem(listId: string, label: string, items: Item[]): Item {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		listId,
		label,
		done: false,
		doneAt: null,
		doneById: null,
		position: Math.max(0, ...items.map((item) => item.position)) + 1,
		createdById: null,
		createdAt: now,
		updatedAt: now,
	};
}

/** The items once `labels` are added, by the API's rule (`resolveAddition()`). */
function withLabels(listId: string, items: Item[], labels: string[]): Item[] {
	let current = items;
	for (const label of labels) {
		const addition = resolveAddition(current, label);
		if (addition.kind === "add") {
			current = [...current, pendingItem(listId, label, current)];
		} else if (addition.kind === "restore") {
			current = current.map((item) =>
				item.id === addition.item.id
					? applyChanges(item, { done: false })
					: item,
			);
		}
	}
	return current;
}

function applyChanges(item: Item, changes: UpdateItem): Item {
	const doneChanged = changes.done !== undefined && changes.done !== item.done;
	return {
		...item,
		label: changes.label ?? item.label,
		position: changes.position ?? item.position,
		...(doneChanged && {
			done: changes.done ?? item.done,
			doneAt: changes.done ? new Date().toISOString() : null,
		}),
	};
}

/**
 * Changes to a list and its items. Item and name changes show at once
 * (optimistic update), then are rolled back if the API refuses them.
 */
export function useListMutations(
	listId: string,
	onError: (error: unknown) => void,
) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const api = getApi();
	const itemsKey = listKeys.items(listId);
	const listKey = listKeys.detail(listId);

	/** Updates the cached items at once; returns how to undo it. */
	async function updateItems(update: (items: Item[]) => Item[]) {
		await queryClient.cancelQueries({ queryKey: itemsKey });
		const previous = queryClient.getQueryData<Page<Item>>(itemsKey);
		if (previous) {
			const items = update(previous.items);
			queryClient.setQueryData<Page<Item>>(itemsKey, {
				...previous,
				items,
				total: items.length,
			});
		}
		return { rollback: () => queryClient.setQueryData(itemsKey, previous) };
	}

	const itemMutationOptions = {
		onError: (
			error: unknown,
			_: unknown,
			context?: { rollback: () => void },
		) => {
			context?.rollback();
			onError(error);
		},
		// Reloads the real data, and the counts shown on "My lists"
		onSettled: () => queryClient.invalidateQueries({ queryKey: listKeys.all }),
	};

	const addItem = useMutation({
		mutationFn: (label: string) => api.items.add(listId, { label }),
		onMutate: (label: string) =>
			updateItems((items) => [...items, pendingItem(listId, label, items)]),
		...itemMutationOptions,
	});

	const addItems = useMutation({
		mutationFn: (labels: string[]) => api.items.addMany(listId, { labels }),
		onMutate: (labels: string[]) =>
			updateItems((items) => withLabels(listId, items, labels)),
		...itemMutationOptions,
	});

	const updateItem = useMutation({
		mutationFn: ({
			itemId,
			changes,
		}: {
			itemId: string;
			changes: UpdateItem;
		}) => api.items.update(listId, itemId, changes),
		onMutate: ({ itemId, changes }) =>
			updateItems((items) =>
				items.map((item) =>
					item.id === itemId ? applyChanges(item, changes) : item,
				),
			),
		...itemMutationOptions,
	});

	const updateAllItems = useMutation({
		mutationFn: (done: boolean) => api.items.updateAll(listId, { done }),
		onMutate: (done: boolean) =>
			updateItems((items) => items.map((item) => applyChanges(item, { done }))),
		...itemMutationOptions,
	});

	const deleteItem = useMutation({
		mutationFn: (itemId: string) => api.items.remove(listId, itemId),
		onMutate: (itemId: string) =>
			updateItems((items) => items.filter((item) => item.id !== itemId)),
		...itemMutationOptions,
	});

	const renameList = useMutation({
		mutationFn: (name: string) => api.lists.rename(listId, { name }),
		onMutate: async (name: string) => {
			await queryClient.cancelQueries({ queryKey: listKey, exact: true });
			const previous = queryClient.getQueryData<List>(listKey);
			if (previous) {
				queryClient.setQueryData<List>(listKey, { ...previous, name });
			}
			return { rollback: () => queryClient.setQueryData(listKey, previous) };
		},
		...itemMutationOptions,
	});

	// Not optimistic: leaving the page before the API confirms would hide a failure
	const deleteList = useMutation({
		mutationFn: () => api.lists.remove(listId),
		onSuccess: async () => {
			await navigate({ to: "/lists" });
			queryClient.removeQueries({ queryKey: listKey });
			await queryClient.invalidateQueries({ queryKey: listKeys.all });
		},
		onError,
	});

	return {
		addItem,
		addItems,
		updateItem,
		updateAllItems,
		deleteItem,
		renameList,
		deleteList,
	};
}
