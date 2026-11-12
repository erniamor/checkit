import type { Active, Over } from "@dnd-kit/core";
import type { Item } from "@repo/schemas";
import { describe, expect, it } from "vitest";
import { itemAnnouncements } from "@/features/lists/item-announcements";

function item(id: string, label: string): Item {
	return {
		id,
		listId: "list",
		label,
		done: false,
		doneAt: null,
		doneById: null,
		position: 1,
		createdById: null,
		createdAt: "",
		updatedAt: "",
	};
}

const items = [item("a", "Milk"), item("b", "Eggs"), item("c", "Bread")];
const active = { id: "a" } as Active;
const over = { id: "c" } as Over;

describe("itemAnnouncements", () => {
	it("tells where the item is, from pick-up to drop", () => {
		const announce = itemAnnouncements(items);

		expect(announce.onDragStart({ active })).toBe(
			"Picked up “Milk”, position 1 of 3.",
		);
		expect(announce.onDragOver({ active, over })).toBe(
			"“Milk” is at position 3 of 3.",
		);
		expect(announce.onDragEnd({ active, over })).toBe(
			"“Milk” dropped at position 3 of 3.",
		);
	});

	it("says when the move is cancelled", () => {
		expect(itemAnnouncements(items).onDragCancel({ active, over: null })).toBe(
			"Move cancelled: “Milk” is back at position 1.",
		);
	});
});
