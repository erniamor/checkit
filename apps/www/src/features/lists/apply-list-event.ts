import type { Page } from "@repo/resources";
import type { Item, List, ListEvent } from "@repo/schemas";

/** What an event means for the user looking at the list. */
export type ListEventOutcome =
	/** The cached data was updated. */
	| { kind: "patched" }
	/** The cache can't be patched safely: reload the items. */
	| { kind: "reload" }
	/** The list is gone for this user: leave the page. */
	| { kind: "leave"; reason: "deleted" | "access_lost" }
	| { kind: "ignored" };

interface Cache {
	items: Page<Item> | undefined;
	list: List | undefined;
}

interface Applied {
	outcome: ListEventOutcome;
	items?: Page<Item>;
	list?: List;
}

function withItems(page: Page<Item>, items: Item[]): Page<Item> {
	return { ...page, items, total: items.length };
}

/**
 * Applies a real-time event to the cached list and items, as seen by `meId`.
 * Pure: returns the new data, the caller writes it to the cache.
 */
export function applyListEvent(
	event: ListEvent,
	meId: string,
	{ items, list }: Cache,
): Applied {
	const fromMe = event.actorId === meId;

	switch (event.type) {
		case "items.created": {
			// My own additions already show, with a temporary id: reload to get
			// the real ones rather than showing them twice
			if (fromMe || !items) {
				return { outcome: { kind: "reload" } };
			}
			const known = new Set(items.items.map((item) => item.id));
			const added = event.items.filter((item) => !known.has(item.id));
			return {
				outcome: { kind: "patched" },
				items: withItems(items, [...items.items, ...added]),
			};
		}
		case "item.updated":
			if (!items) {
				return { outcome: { kind: "ignored" } };
			}
			return {
				outcome: { kind: "patched" },
				items: withItems(
					items,
					items.items.map((item) =>
						item.id === event.item.id ? event.item : item,
					),
				),
			};
		case "item.deleted":
			if (!items) {
				return { outcome: { kind: "ignored" } };
			}
			return {
				outcome: { kind: "patched" },
				items: withItems(
					items,
					items.items.filter((item) => item.id !== event.itemId),
				),
			};
		case "list.updated":
			if (!list) {
				return { outcome: { kind: "ignored" } };
			}
			return {
				outcome: { kind: "patched" },
				list: { ...list, name: event.name, updatedAt: event.updatedAt },
			};
		case "list.deleted":
			// When I delete it, the deletion itself already leaves the page
			return {
				outcome: fromMe
					? { kind: "ignored" }
					: { kind: "leave", reason: "deleted" },
			};
		case "member.updated":
			if (event.member.userId !== meId || !list) {
				return { outcome: { kind: "ignored" } };
			}
			return {
				outcome: { kind: "patched" },
				list: { ...list, role: event.member.role },
			};
		case "member.removed":
			return {
				outcome:
					event.userId === meId
						? { kind: "leave", reason: "access_lost" }
						: { kind: "ignored" },
			};
		case "member.added":
			return { outcome: { kind: "ignored" } };
	}
}
