import type { Item, List, MemberRole } from "@repo/schemas";
import type { ApiRequest, ApiResponse } from "@/test/mock-api";

export const listId = "0b7e3f4a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
/** The signed-in user, who created the items. */
export const meId = "5f1b7c2e-8d4a-4e6b-9c3f-1a2b3c4d5e6f";
const userId = meId;
/** Another member of the list. */
export const otherUserId = "8e7d6c5b-4a3f-4e2d-9c1b-0a9f8e7d6c5b";
const date = "2026-11-10T08:00:00.000Z";

interface FakeListServerOptions {
	role?: MemberRole;
	/** Labels of the items; a label ending with " ✓" is checked. */
	items?: string[];
	/** Other lists returned by GET /lists. */
	otherLists?: List[];
}

function makeItem(label: string, position: number): Item {
	const done = label.endsWith(" ✓");
	return {
		id: `00000000-0000-4000-8000-${String(position).padStart(12, "0")}`,
		listId,
		label: done ? label.slice(0, -2) : label,
		done,
		doneAt: done ? date : null,
		doneById: done ? userId : null,
		position,
		createdById: userId,
		createdAt: date,
		updatedAt: date,
	};
}

function paginated<T>(data: T[]) {
	return { data, pagination: { page: 1, pageSize: 50, total: data.length } };
}

/**
 * An in-memory API for one list ("Groceries") and its items, so the app's
 * reloads after a change see that change. `failNext(status)` makes the next
 * change fail.
 */
export function fakeListServer({
	role = "owner",
	items = [],
	otherLists = [],
}: FakeListServerOptions = {}) {
	let name = "Groceries";
	let myRole = role;
	let stored = items.map((label, index) => makeItem(label, index + 1));
	let failure: number | undefined;

	const list = (): List => ({
		id: listId,
		name,
		role: myRole,
		itemCount: stored.length,
		doneCount: stored.filter((item) => item.done).length,
		createdAt: date,
		updatedAt: date,
	});

	function respond({
		method,
		path,
		body,
	}: ApiRequest): ApiResponse | undefined {
		if (method !== "GET" && failure !== undefined) {
			const status = failure;
			failure = undefined;
			return {
				status,
				body: { error: { code: "internal_error", message: "" } },
			};
		}
		const input = (body ?? {}) as Record<string, unknown>;
		const itemPath = path.match(/^\/lists\/[^/]+\/items\/([^/]+)$/);

		if (method === "GET" && path === "/lists") {
			return { status: 200, body: paginated([list(), ...otherLists]) };
		}
		if (method === "GET" && path === `/lists/${listId}`) {
			return { status: 200, body: list() };
		}
		if (method === "GET" && path === `/lists/${listId}/items`) {
			return { status: 200, body: paginated(stored) };
		}
		if (method === "PATCH" && path === `/lists/${listId}`) {
			name = String(input.name);
			return { status: 200, body: list() };
		}
		if (method === "DELETE" && path === `/lists/${listId}`) {
			return { status: 204 };
		}
		if (method === "POST" && path === `/lists/${listId}/items`) {
			const item = makeItem(String(input.label), stored.length + 1);
			stored = [...stored, item];
			return { status: 201, body: item };
		}
		if (itemPath && method === "PATCH") {
			stored = stored.map((item) =>
				item.id === itemPath[1]
					? {
							...item,
							...(input.label !== undefined && { label: String(input.label) }),
							...(input.done !== undefined && {
								done: Boolean(input.done),
								doneAt: input.done ? date : null,
							}),
						}
					: item,
			);
			return {
				status: 200,
				body: stored.find((item) => item.id === itemPath[1]),
			};
		}
		if (itemPath && method === "DELETE") {
			stored = stored.filter((item) => item.id !== itemPath[1]);
			return { status: 204 };
		}
		return undefined;
	}

	return {
		respond,
		failNext(status = 500) {
			failure = status;
		},
		labels: () => stored.map((item) => item.label),
		/** The stored item at `position` (from 1). */
		item(position: number): Item {
			const found = stored.find((item) => item.position === position);
			if (!found) {
				throw new Error(`No item at position ${position}`);
			}
			return found;
		},
		/** Another member's changes, made straight in the "database". */
		other: {
			addItem(label: string): Item {
				const item = {
					...makeItem(label, stored.length + 1),
					createdById: otherUserId,
				};
				stored = [...stored, item];
				return item;
			},
			updateItem(itemId: string, changes: Partial<Item>): Item {
				stored = stored.map((item) =>
					item.id === itemId ? { ...item, ...changes } : item,
				);
				const updated = stored.find((item) => item.id === itemId);
				if (!updated) {
					throw new Error(`No item ${itemId}`);
				}
				return updated;
			},
			removeItem(itemId: string): void {
				stored = stored.filter((item) => item.id !== itemId);
			},
			renameList(newName: string): void {
				name = newName;
			},
			/** The owner changes the signed-in user's role. */
			changeMyRole(newRole: MemberRole): void {
				myRole = newRole;
			},
		},
	};
}
