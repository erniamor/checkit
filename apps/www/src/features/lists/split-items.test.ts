import type { Item } from "@repo/schemas";
import { describe, expect, it } from "vitest";
import { splitItems } from "@/features/lists/split-items";

function item(label: string, position: number, done = false): Item {
	return {
		id: label,
		listId: "list",
		label,
		done,
		doneAt: null,
		doneById: null,
		position,
		createdById: null,
		createdAt: "",
		updatedAt: "",
	};
}

describe("splitItems", () => {
	it("puts the checked items apart, each group in list order", () => {
		const { open, checked } = splitItems([
			item("Bread", 3),
			item("Milk", 1, true),
			item("Eggs", 2),
			item("Coffee", 0.5, true),
		]);

		expect(open.map((i) => i.label)).toEqual(["Eggs", "Bread"]);
		expect(checked.map((i) => i.label)).toEqual(["Coffee", "Milk"]);
	});
});
