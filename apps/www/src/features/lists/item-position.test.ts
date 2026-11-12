import type { Item } from "@repo/schemas";
import { describe, expect, it } from "vitest";
import { movedPosition, positionBetween } from "@/features/lists/item-position";

function item(id: string, position: number): Item {
	return {
		id,
		listId: "list",
		label: id,
		done: false,
		doneAt: null,
		doneById: null,
		position,
		createdById: null,
		createdAt: "",
		updatedAt: "",
	};
}

describe("positionBetween", () => {
	it("is halfway between two neighbors", () => {
		expect(positionBetween(1, 2)).toBe(1.5);
	});

	it("goes before the first item, or after the last one", () => {
		expect(positionBetween(undefined, 1)).toBe(0);
		expect(positionBetween(3, undefined)).toBe(4);
		expect(positionBetween()).toBe(1);
	});
});

describe("movedPosition", () => {
	const items = [item("a", 1), item("b", 2), item("c", 3), item("d", 4)];

	it("moves an item down, after the one it's dropped on", () => {
		expect(movedPosition(items, "a", "c")).toBe(3.5);
		expect(movedPosition(items, "a", "d")).toBe(5);
	});

	it("moves an item up, before the one it's dropped on", () => {
		expect(movedPosition(items, "d", "b")).toBe(1.5);
		expect(movedPosition(items, "c", "a")).toBe(0);
	});

	it("doesn't move an item dropped on itself or out of the list", () => {
		expect(movedPosition(items, "b", "b")).toBeUndefined();
		expect(movedPosition(items, "b", "unknown")).toBeUndefined();
	});

	it("keeps the order of the items within a section, whatever the others' positions", () => {
		// Positions 2 and 3 belong to checked items, shown elsewhere
		const open = [item("a", 1), item("b", 4), item("c", 5)];

		expect(movedPosition(open, "c", "b")).toBe(2.5);
	});
});
