import { api, createList, joinList } from "@test/helpers/api";
import { signIn } from "@test/helpers/auth";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("GET /v1/lists/:listId/members", () => {
	it("lists the members with their role, in joining order", async () => {
		const alice = await signIn("alice@example.com");
		const list = await createList(alice);
		const bob = await joinList(list.id, "bob@example.com", "viewer");

		const response = await api(`/v1/lists/${list.id}/members`, {
			cookie: bob,
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			data: [
				{
					userId: expect.any(String),
					name: "",
					email: "alice@example.com",
					image: null,
					role: "owner",
					joinedAt: expect.any(String),
				},
				expect.objectContaining({ email: "bob@example.com", role: "viewer" }),
			],
			pagination: { page: 1, pageSize: 50, total: 2 },
		});
	});

	it("hides the members from a non-member", async () => {
		const alice = await signIn("alice@example.com");
		const list = await createList(alice);
		const bob = await signIn("bob@example.com");

		const response = await api(`/v1/lists/${list.id}/members`, {
			cookie: bob,
		});

		expect(response.status).toBe(404);
	});
});
