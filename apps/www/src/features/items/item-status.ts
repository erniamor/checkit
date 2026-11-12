import type { Item, ItemStatus, ItemWithList } from "@repo/schemas";
import { m } from "@/paraglide/messages";

/** The filters, in the order they're offered. */
export const itemStatusOptions = [
	{ status: "open", label: () => m.items_filter_open() },
	{ status: "checked", label: () => m.items_filter_checked() },
	{ status: "all", label: () => m.items_filter_all() },
] as const satisfies readonly { status: ItemStatus; label: () => string }[];

export const emptyMessages: Record<ItemStatus, () => string> = {
	open: () => m.all_items_empty_open(),
	checked: () => m.all_items_empty_checked(),
	all: () => m.all_items_empty_all(),
};

/** Whether an item belongs in the view filtered by `status`. */
export function matchesStatus(item: Pick<Item, "done">, status: ItemStatus) {
	switch (status) {
		case "open":
			return !item.done;
		case "checked":
			return item.done;
		case "all":
			return true;
	}
}

export interface ListGroup {
	list: ItemWithList["list"];
	items: ItemWithList[];
}

/** Groups items by list, keeping the order in which lists and items come. */
export function groupByList(items: readonly ItemWithList[]): ListGroup[] {
	const groups = new Map<string, ListGroup>();
	for (const item of items) {
		const group = groups.get(item.list.id);
		if (group) {
			group.items.push(item);
		} else {
			groups.set(item.list.id, { list: item.list, items: [item] });
		}
	}
	return [...groups.values()];
}
