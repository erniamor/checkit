import type { Page } from "@repo/resources";
import type { Item, List } from "@repo/schemas";
import { describe, expect, it } from "vitest";
import { applyListEvent } from "@/features/lists/apply-list-event";

const listId = "0b7e3f4a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const me = "5f1b7c2e-8d4a-4e6b-9c3f-1a2b3c4d5e6f";
const other = "8e7d6c5b-4a3f-4e2d-9c1b-0a9f8e7d6c5b";

function item(id: string, label: string): Item {
	return {
		id,
		listId,
		label,
		done: false,
		doneAt: null,
		doneById: null,
		position: 1,
		createdById: other,
		createdAt: "",
		updatedAt: "",
	};
}

function page(items: Item[]): Page<Item> {
	return { items, page: 1, pageSize: 200, total: items.length };
}

const list: List = {
	id: listId,
	name: "Groceries",
	role: "editor",
	itemCount: 0,
	doneCount: 0,
	createdAt: "",
	updatedAt: "",
};

describe("applyListEvent", () => {
	it("adds another member's items once, even if the event comes twice", () => {
		const milk = item("a", "Milk");
		const event = {
			type: "items.created" as const,
			listId,
			actorId: other,
			items: [milk],
		};

		const once = applyListEvent(event, me, { items: page([]), list });
		const twice = applyListEvent(event, me, { items: once.items, list });

		expect(twice.items?.items).toEqual([milk]);
		expect(twice.items?.total).toBe(1);
	});

	it("reloads instead of adding my own items, already shown", () => {
		const applied = applyListEvent(
			{
				type: "items.created",
				listId,
				actorId: me,
				items: [item("a", "Milk")],
			},
			me,
			{ items: page([]), list },
		);

		expect(applied).toEqual({ outcome: { kind: "reload" } });
	});

	it("only changes my role for an update of my own membership", () => {
		const member = {
			userId: other,
			name: "Bob",
			email: "bob@example.com",
			image: null,
			role: "viewer" as const,
			joinedAt: "",
		};

		expect(
			applyListEvent(
				{ type: "member.updated", listId, actorId: me, member },
				me,
				{ items: undefined, list },
			).outcome,
		).toEqual({ kind: "ignored" });
		expect(
			applyListEvent(
				{
					type: "member.updated",
					listId,
					actorId: other,
					member: { ...member, userId: me },
				},
				me,
				{ items: undefined, list },
			).list?.role,
		).toBe("viewer");
	});

	it("leaves when the list is deleted by someone else, not by me", () => {
		expect(
			applyListEvent({ type: "list.deleted", listId, actorId: other }, me, {
				items: undefined,
				list,
			}).outcome,
		).toEqual({ kind: "leave", reason: "deleted" });
		expect(
			applyListEvent({ type: "list.deleted", listId, actorId: me }, me, {
				items: undefined,
				list,
			}).outcome,
		).toEqual({ kind: "ignored" });
	});
});

describe("applyListEvent and the members", () => {
	function member(userId: string, role: "editor" | "viewer" = "editor") {
		return {
			userId,
			name: "",
			email: `${userId}@example.com`,
			image: null,
			role,
			joinedAt: "",
		};
	}
	const members = {
		items: [member(me), member(other)],
		page: 1,
		pageSize: 100,
		total: 2,
	};

	it("adds, updates and removes another member", () => {
		const carol = member("carol");
		const added = applyListEvent(
			{ type: "member.added", listId, actorId: "carol", member: carol },
			me,
			{ items: undefined, list, members },
		);
		expect(added.members?.items.map((m) => m.userId)).toEqual([
			me,
			other,
			"carol",
		]);

		const updated = applyListEvent(
			{
				type: "member.updated",
				listId,
				actorId: me,
				member: member(other, "viewer"),
			},
			me,
			{ items: undefined, list, members },
		);
		expect(updated.members?.items[1]?.role).toBe("viewer");
		expect(updated.list).toBeUndefined();

		const removed = applyListEvent(
			{ type: "member.removed", listId, actorId: me, userId: other },
			me,
			{ items: undefined, list, members },
		);
		expect(removed.members?.items.map((m) => m.userId)).toEqual([me]);
	});

	it("doesn't leave the page twice when I leave the list myself", () => {
		expect(
			applyListEvent(
				{ type: "member.removed", listId, actorId: me, userId: me },
				me,
				{ items: undefined, list, members },
			).outcome,
		).toEqual({ kind: "ignored" });
	});
});
