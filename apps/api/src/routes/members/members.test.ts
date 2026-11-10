import type { List, Member, Paginated } from "@repo/schemas";
import { api, createList, joinList, json } from "@test/helpers/api";
import { signIn } from "@test/helpers/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ErrorBody } from "@/lib/errors";

afterEach(() => {
	vi.restoreAllMocks();
});

/** A list owned by Alice, with Bob as viewer. */
async function sharedList() {
	const alice = await signIn("alice@example.com");
	const list = await createList(alice);
	const bob = await joinList(list.id, "bob@example.com", "viewer");
	const members = await json<Paginated<Member>>(
		await api(`/v1/lists/${list.id}/members`, { cookie: alice }),
	);
	const idOf = (email: string) =>
		members.data.find((member) => member.email === email)?.userId ?? "";
	return {
		alice,
		bob,
		list,
		aliceId: idOf("alice@example.com"),
		bobId: idOf("bob@example.com"),
	};
}

function memberPath(list: List, userId: string) {
	return `/v1/lists/${list.id}/members/${userId}`;
}

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

describe("PATCH /v1/lists/:listId/members/:userId", () => {
	it("lets the owner change a member's role", async () => {
		const { alice, bob, list, bobId } = await sharedList();

		const response = await api(memberPath(list, bobId), {
			method: "PATCH",
			cookie: alice,
			body: { role: "editor" },
		});

		expect(response.status).toBe(200);
		expect(await json<Member>(response)).toMatchObject({
			email: "bob@example.com",
			role: "editor",
		});
		expect(
			(await json<List>(await api(`/v1/lists/${list.id}`, { cookie: bob })))
				.role,
		).toBe("editor");
	});

	it("doesn't change the owner's role", async () => {
		const { alice, list, aliceId } = await sharedList();

		const response = await api(memberPath(list, aliceId), {
			method: "PATCH",
			cookie: alice,
			body: { role: "viewer" },
		});

		expect(response.status).toBe(409);
		expect((await json<ErrorBody>(response)).error.code).toBe(
			"owner_role_locked",
		);
	});

	it("answers 404 for a user who isn't a member", async () => {
		const { alice, list } = await sharedList();

		const response = await api(
			memberPath(list, "00000000-0000-4000-8000-000000000000"),
			{ method: "PATCH", cookie: alice, body: { role: "editor" } },
		);

		expect(response.status).toBe(404);
		expect((await json<ErrorBody>(response)).error.code).toBe(
			"member_not_found",
		);
	});

	it("is reserved to the owner", async () => {
		const { bob, list, bobId } = await sharedList();

		const response = await api(memberPath(list, bobId), {
			method: "PATCH",
			cookie: bob,
			body: { role: "editor" },
		});

		expect(response.status).toBe(403);
	});
});

describe("DELETE /v1/lists/:listId/members/:userId", () => {
	it("lets the owner remove a member, who loses access", async () => {
		const { alice, bob, list, bobId } = await sharedList();

		const response = await api(memberPath(list, bobId), {
			method: "DELETE",
			cookie: alice,
		});

		expect(response.status).toBe(204);
		expect((await api(`/v1/lists/${list.id}`, { cookie: bob })).status).toBe(
			404,
		);
	});

	it("doesn't remove the owner", async () => {
		const { alice, list, aliceId } = await sharedList();

		const response = await api(memberPath(list, aliceId), {
			method: "DELETE",
			cookie: alice,
		});

		expect(response.status).toBe(409);
	});
});

describe("DELETE /v1/lists/:listId/members/me", () => {
	it("lets a member leave the list", async () => {
		const { bob, list } = await sharedList();

		const response = await api(`/v1/lists/${list.id}/members/me`, {
			method: "DELETE",
			cookie: bob,
		});

		expect(response.status).toBe(204);
		expect((await api(`/v1/lists/${list.id}`, { cookie: bob })).status).toBe(
			404,
		);
	});

	it("doesn't let the owner leave", async () => {
		const { alice, list } = await sharedList();

		const response = await api(`/v1/lists/${list.id}/members/me`, {
			method: "DELETE",
			cookie: alice,
		});

		expect(response.status).toBe(409);
		expect((await json<ErrorBody>(response)).error.code).toBe(
			"owner_cannot_leave",
		);
	});
});
