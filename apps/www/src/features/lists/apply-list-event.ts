import type { Page } from "@repo/resources";
import type { Item, List, ListEvent, Member } from "@repo/schemas";

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
	members?: Page<Member> | undefined;
}

interface Applied {
	outcome: ListEventOutcome;
	items?: Page<Item>;
	list?: List;
	members?: Page<Member>;
}

function withItems(page: Page<Item>, items: Item[]): Page<Item> {
	return { ...page, items, total: items.length };
}

function withMembers(page: Page<Member>, members: Member[]): Page<Member> {
	return { ...page, items: members, total: members.length };
}

/**
 * Applies a real-time event to the cached list and items, as seen by `meId`.
 * Pure: returns the new data, the caller writes it to the cache.
 */
export function applyListEvent(
	event: ListEvent,
	meId: string,
	{ items, list, members }: Cache,
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
		case "member.added": {
			if (!members) {
				return { outcome: { kind: "ignored" } };
			}
			const known = members.items.some(
				(member) => member.userId === event.member.userId,
			);
			return {
				outcome: { kind: "patched" },
				members: known
					? members
					: withMembers(members, [...members.items, event.member]),
			};
		}
		case "member.updated": {
			const isMe = event.member.userId === meId;
			if (!members && !(isMe && list)) {
				return { outcome: { kind: "ignored" } };
			}
			return {
				outcome: { kind: "patched" },
				// My own role decides what I can do on the list
				list: isMe && list ? { ...list, role: event.member.role } : undefined,
				members: members
					? withMembers(
							members,
							members.items.map((member) =>
								member.userId === event.member.userId ? event.member : member,
							),
						)
					: undefined,
			};
		}
		case "member.removed":
			// Removed by someone else; when I leave, leaving itself changes the page
			if (event.userId === meId) {
				return {
					outcome: fromMe
						? { kind: "ignored" }
						: { kind: "leave", reason: "access_lost" },
				};
			}
			if (!members) {
				return { outcome: { kind: "ignored" } };
			}
			return {
				outcome: { kind: "patched" },
				members: withMembers(
					members,
					members.items.filter((member) => member.userId !== event.userId),
				),
			};
	}
}
