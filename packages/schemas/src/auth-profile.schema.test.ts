import { describe, expect, it } from "vitest";
import { signInWithCodeSchema } from "./auth.schema";
import { PROFILE_NAME_MAX_LENGTH, updateProfileSchema } from "./profile.schema";

function messages(result: { error?: { issues: { message: string }[] } }) {
	return result.error?.issues.map((issue) => issue.message) ?? [];
}

describe("signInWithCodeSchema", () => {
	it("accepts a 6-digit code, trimmed, and normalizes the email", () => {
		expect(
			signInWithCodeSchema.parse({
				email: " Bob@Example.com",
				code: " 123456 ",
			}),
		).toEqual({ email: "bob@example.com", code: "123456" });
	});

	it("rejects a code that isn't 6 digits", () => {
		for (const code of ["12345", "1234567", "12a456", ""]) {
			expect(
				messages(
					signInWithCodeSchema.safeParse({ email: "bob@example.com", code }),
				),
			).toEqual(["code_invalid"]);
		}
	});
});

describe("updateProfileSchema", () => {
	it("accepts a name and trims it", () => {
		expect(updateProfileSchema.parse({ name: "  Alice " })).toEqual({
			name: "Alice",
		});
	});

	it("rejects a blank or too long name", () => {
		expect(messages(updateProfileSchema.safeParse({ name: "  " }))).toEqual([
			"name_required",
		]);
		expect(
			messages(
				updateProfileSchema.safeParse({
					name: "a".repeat(PROFILE_NAME_MAX_LENGTH + 1),
				}),
			),
		).toEqual(["name_too_long"]);
	});
});
