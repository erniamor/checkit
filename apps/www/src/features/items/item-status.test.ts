import type { ItemWithList } from "@repo/schemas";
import { describe, expect, it } from "vitest";
import { groupByList, matchesStatus } from "@/features/items/item-status";

function item(id: string, listId: string): ItemWithList {
	return {
		id,
		listId,
		label: id,
		done: false,
		doneAt: null,
		doneById: null,
		position: 1,
		createdById: null,
		createdAt: "",
		updatedAt: "",
		list: { id: listId, name: listId, role: "owner" },
	};
}

describe("matchesStatus", () => {
	it("keeps the items to do, the checked ones, or all of them", () => {
		expect(matchesStatus({ done: false }, "open")).toBe(true);
		expect(matchesStatus({ done: true }, "open")).toBe(false);
		expect(matchesStatus({ done: true }, "checked")).toBe(true);
		expect(matchesStatus({ done: false }, "checked")).toBe(false);
		expect(matchesStatus({ done: true }, "all")).toBe(true);
		expect(matchesStatus({ done: false }, "all")).toBe(true);
	});
});

describe("groupByList", () => {
	it("groups the items by list, keeping their order", () => {
		const groups = groupByList([
			item("milk", "groceries"),
			item("nails", "hardware"),
			item("eggs", "groceries"),
		]);

		expect(
			groups.map((group) => [
				group.list.id,
				group.items.map((entry) => entry.id),
			]),
		).toEqual([
			["groceries", ["milk", "eggs"]],
			["hardware", ["nails"]],
		]);
	});
});
