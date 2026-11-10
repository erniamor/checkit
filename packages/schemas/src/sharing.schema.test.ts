import { describe, expect, it } from "vitest";
import { createInvitationSchema } from "./invitations.schema";
import { updateMemberSchema } from "./members.schema";
import { createShareLinkSchema } from "./share-links.schema";

describe("createInvitationSchema", () => {
	it("normalizes the email", () => {
		expect(
			createInvitationSchema.parse({
				email: "  Bob@Example.COM ",
				role: "editor",
			}),
		).toEqual({ email: "bob@example.com", role: "editor" });
	});

	it("rejects an invalid email with an error code", () => {
		const result = createInvitationSchema.safeParse({
			email: "not-an-email",
			role: "viewer",
		});

		expect(result.error?.issues.map((issue) => issue.message)).toEqual([
			"email_invalid",
		]);
	});

	it("doesn't allow inviting an owner", () => {
		expect(
			createInvitationSchema.safeParse({
				email: "bob@example.com",
				role: "owner",
			}).success,
		).toBe(false);
	});
});

describe("createShareLinkSchema and updateMemberSchema", () => {
	it("accept only the shareable roles", () => {
		for (const schema of [createShareLinkSchema, updateMemberSchema]) {
			expect(schema.safeParse({ role: "editor" }).success).toBe(true);
			expect(schema.safeParse({ role: "viewer" }).success).toBe(true);
			expect(schema.safeParse({ role: "owner" }).success).toBe(false);
		}
	});
});
