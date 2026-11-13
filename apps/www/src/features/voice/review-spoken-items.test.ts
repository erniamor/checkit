import type { Item } from "@repo/schemas";
import { describe, expect, it } from "vitest";
import {
	checkSpokenItems,
	spokenItemHint,
} from "@/features/voice/review-spoken-items";

function item(label: string, done: boolean): Item {
	return {
		id: crypto.randomUUID(),
		listId: crypto.randomUUID(),
		label,
		done,
		doneAt: null,
		doneById: null,
		position: 1,
		createdById: null,
		createdAt: "2026-11-12T08:00:00.000Z",
		updatedAt: "2026-11-12T08:00:00.000Z",
	};
}

describe("spokenItemHint", () => {
	const items = [item("Milk", false), item("Eggs", true)];

	it("says what happens to a label the list already has", () => {
		expect(spokenItemHint(items, "milk")).toBe(
			"Already in the list: it won't be added again.",
		);
		expect(spokenItemHint(items, "Eggs ")).toBe(
			"Checked in the list: it will be unchecked.",
		);
		expect(spokenItemHint(items, "Bread")).toBeUndefined();
	});
});

describe("checkSpokenItems", () => {
	it("accepts valid labels, trimmed", () => {
		expect(checkSpokenItems([" Milk", "Eggs"])).toEqual({
			ok: true,
			labels: ["Milk", "Eggs"],
		});
	});

	it("gives each invalid label its error", () => {
		expect(checkSpokenItems(["Milk", " ", "x".repeat(201)])).toEqual({
			ok: false,
			fields: [
				undefined,
				"Enter the item.",
				"The item is too long (200 characters at most).",
			],
		});
	});

	it("refuses an empty set, or too many at once", () => {
		expect(checkSpokenItems([])).toMatchObject({
			ok: false,
			form: "Keep at least one item.",
		});
		expect(
			checkSpokenItems(Array.from({ length: 51 }, (_, index) => `${index}`)),
		).toMatchObject({
			ok: false,
			form: "That's too many items at once (50 at most).",
		});
	});
});
