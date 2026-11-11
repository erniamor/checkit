import type { Item } from "@repo/schemas";

interface SplitItems {
	open: Item[];
	checked: Item[];
}

/**
 * Items still to do first, checked ones below, each group in list order. Only
 * the display changes: the items keep their position.
 */
export function splitItems(items: readonly Item[]): SplitItems {
	const ordered = [...items].sort((a, b) => a.position - b.position);
	return {
		open: ordered.filter((item) => !item.done),
		checked: ordered.filter((item) => item.done),
	};
}
