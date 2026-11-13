import type { Item } from "@repo/schemas";
import { describe, expect, it } from "vitest";
import {
	itemWithLabel,
	resolveAddition,
} from "@/features/lists/duplicate-label";

function item(id: string, label: string, done = false): Item {
	return {
		id,
		listId: "list",
		label,
		done,
		doneAt: null,
		doneById: null,
		position: 1,
		createdById: null,
		createdAt: "",
		updatedAt: "",
	};
}

const milk = item("a", "Oat milk");
const eggs = item("b", "Eggs", true);

describe("resolveAddition", () => {
	it("adds a new label", () => {
		expect(resolveAddition([milk, eggs], "Bread")).toEqual({ kind: "add" });
	});

	it("refuses a label among the items to do, case and spaces aside", () => {
		expect(resolveAddition([milk, eggs], " oat  MILK")).toEqual({
			kind: "taken",
			item: milk,
		});
	});

	it("unchecks a checked item rather than adding it again", () => {
		expect(resolveAddition([milk, eggs], "eggs")).toEqual({
			kind: "restore",
			item: eggs,
		});
	});
});

describe("itemWithLabel", () => {
	it("ignores the item being renamed", () => {
		expect(itemWithLabel([milk, eggs], "OAT MILK", milk.id)).toBeUndefined();
		expect(itemWithLabel([milk, eggs], "eggs", milk.id)).toBe(eggs);
	});
});
