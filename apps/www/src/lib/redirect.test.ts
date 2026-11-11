import { describe, expect, it } from "vitest";
import { redirectSearchSchema } from "@/lib/redirect";

describe("redirectSearchSchema", () => {
	it("keeps a path of the app", () => {
		expect(redirectSearchSchema.parse({ redirect: "/lists?tab=mine" })).toEqual(
			{
				redirect: "/lists?tab=mine",
			},
		);
	});

	it.each([
		"https://evil.example.com",
		"//evil.example.com",
		"/\\evil.example.com",
		"lists",
	])("drops %s, which could lead to another site", (redirect) => {
		expect(redirectSearchSchema.parse({ redirect })).toEqual({
			redirect: undefined,
		});
	});

	it("allows no redirect", () => {
		expect(redirectSearchSchema.parse({})).toEqual({ redirect: undefined });
	});
});
