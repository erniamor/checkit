import { describe, expect, it } from "vitest";
import { createListSchema, LIST_NAME_MAX_LENGTH } from "./lists.schema";

function errorsOf(input: unknown) {
	const result = createListSchema.safeParse(input);
	return result.success
		? []
		: result.error.issues.map((issue) => issue.message);
}

describe("createListSchema", () => {
	it("accepts a name and trims it", () => {
		expect(createListSchema.parse({ name: "  Groceries " })).toEqual({
			name: "Groceries",
		});
	});

	it("accepts a name of the maximum length", () => {
		expect(
			createListSchema.safeParse({ name: "a".repeat(LIST_NAME_MAX_LENGTH) })
				.success,
		).toBe(true);
	});

	it("rejects an empty or blank name", () => {
		expect(errorsOf({ name: "" })).toEqual(["list_name_required"]);
		expect(errorsOf({ name: "   " })).toEqual(["list_name_required"]);
	});

	it("rejects a name that is too long", () => {
		expect(errorsOf({ name: "a".repeat(LIST_NAME_MAX_LENGTH + 1) })).toEqual([
			"list_name_too_long",
		]);
	});

	it("rejects a missing name and unknown fields", () => {
		expect(createListSchema.safeParse({}).success).toBe(false);
		expect(
			createListSchema.safeParse({ name: "Groceries", ownerId: "x" }).success,
		).toBe(false);
	});
});
