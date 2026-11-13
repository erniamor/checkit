import { describe, expect, it } from "vitest";
import {
	createListSchema,
	LIST_NAME_MAX_LENGTH,
	updateListSchema,
} from "./lists.schema";

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

describe("list kinds", () => {
	it("creates a list of either kind, purchases when omitted", () => {
		expect(createListSchema.parse({ name: "Home", kind: "tasks" })).toEqual({
			name: "Home",
			kind: "tasks",
		});
		expect(createListSchema.parse({ name: "Groceries" }).kind).toBeUndefined();
		expect(
			createListSchema.safeParse({ name: "Home", kind: "chores" }).success,
		).toBe(false);
	});
});

describe("updateListSchema", () => {
	it("changes the name, the kind or both", () => {
		expect(updateListSchema.parse({ name: " Weekend " })).toEqual({
			name: "Weekend",
		});
		expect(updateListSchema.parse({ kind: "purchases" })).toEqual({
			kind: "purchases",
		});
	});

	it("refuses an update that changes nothing", () => {
		const result = updateListSchema.safeParse({});
		expect(result.error?.issues[0]?.message).toBe("nothing_to_update");
	});
});
