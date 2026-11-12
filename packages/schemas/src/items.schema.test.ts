import { describe, expect, it } from "vitest";
import {
	createItemSchema,
	createItemsBatchSchema,
	ITEM_LABEL_MAX_LENGTH,
	ITEMS_BATCH_MAX_SIZE,
	itemsFilterSchema,
	updateAllItemsSchema,
	updateItemSchema,
} from "./items.schema";

function messages(result: {
	success: boolean;
	error?: { issues: { message: string }[] };
}) {
	return result.error?.issues.map((issue) => issue.message) ?? [];
}

describe("createItemSchema", () => {
	it("accepts a label and trims it", () => {
		expect(createItemSchema.parse({ label: " Milk  " })).toEqual({
			label: "Milk",
		});
	});

	it("rejects a blank label", () => {
		expect(messages(createItemSchema.safeParse({ label: "  " }))).toEqual([
			"item_label_required",
		]);
	});

	it("rejects a label that is too long", () => {
		expect(
			messages(
				createItemSchema.safeParse({
					label: "a".repeat(ITEM_LABEL_MAX_LENGTH + 1),
				}),
			),
		).toEqual(["item_label_too_long"]);
	});
});

describe("createItemsBatchSchema", () => {
	it("accepts several labels", () => {
		expect(
			createItemsBatchSchema.parse({ labels: ["Milk", " Eggs", "Bread "] }),
		).toEqual({ labels: ["Milk", "Eggs", "Bread"] });
	});

	it("rejects an empty batch", () => {
		expect(messages(createItemsBatchSchema.safeParse({ labels: [] }))).toEqual([
			"items_required",
		]);
	});

	it("rejects a batch that is too large", () => {
		const labels = Array.from(
			{ length: ITEMS_BATCH_MAX_SIZE + 1 },
			(_, i) => `Item ${i}`,
		);
		expect(messages(createItemsBatchSchema.safeParse({ labels }))).toEqual([
			"too_many_items",
		]);
	});

	it("rejects a batch containing a blank label", () => {
		expect(
			messages(createItemsBatchSchema.safeParse({ labels: ["Milk", " "] })),
		).toEqual(["item_label_required"]);
	});
});

describe("updateItemSchema", () => {
	it("accepts any single change", () => {
		expect(updateItemSchema.safeParse({ done: true }).success).toBe(true);
		expect(updateItemSchema.safeParse({ label: "Oat milk" }).success).toBe(
			true,
		);
		expect(updateItemSchema.safeParse({ position: 1.5 }).success).toBe(true);
	});

	it("rejects an empty change", () => {
		expect(messages(updateItemSchema.safeParse({}))).toEqual([
			"nothing_to_update",
		]);
	});

	it("rejects a non-finite position", () => {
		expect(
			updateItemSchema.safeParse({ position: Number.POSITIVE_INFINITY })
				.success,
		).toBe(false);
	});

	it("rejects fields that cannot be changed", () => {
		expect(
			updateItemSchema.safeParse({ done: true, listId: "other" }).success,
		).toBe(false);
	});
});

describe("updateAllItemsSchema", () => {
	it("accepts checking or unchecking every item", () => {
		expect(updateAllItemsSchema.parse({ done: true })).toEqual({ done: true });
		expect(updateAllItemsSchema.parse({ done: false })).toEqual({
			done: false,
		});
	});

	it("rejects a missing state or another change", () => {
		expect(updateAllItemsSchema.safeParse({}).success).toBe(false);
		expect(
			updateAllItemsSchema.safeParse({ done: true, label: "Milk" }).success,
		).toBe(false);
	});
});

describe("itemsFilterSchema", () => {
	it("shows the items to do by default", () => {
		expect(itemsFilterSchema.parse({})).toEqual({ status: "open" });
	});

	it("accepts each status and rejects others", () => {
		for (const status of ["open", "checked", "all"]) {
			expect(itemsFilterSchema.parse({ status })).toEqual({ status });
		}
		expect(itemsFilterSchema.safeParse({ status: "done" }).success).toBe(false);
	});
});
