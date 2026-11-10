import type { Item, List, Paginated } from "@repo/schemas";
import { api, createList, joinList, json } from "@test/helpers/api";
import { signIn } from "@test/helpers/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ErrorBody } from "@/lib/errors";

let alice: string;

beforeEach(async () => {
	alice = await signIn("alice@example.com");
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("POST /v1/lists", () => {
	it("requires a session", async () => {
		const response = await api("/v1/lists", {
			method: "POST",
			body: { name: "Groceries" },
		});

		expect(response.status).toBe(401);
	});

	it("creates a list owned by the user", async () => {
		const response = await api("/v1/lists", {
			method: "POST",
			cookie: alice,
			body: { name: "  Groceries " },
		});

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({
			id: expect.any(String),
			name: "Groceries",
			role: "owner",
			itemCount: 0,
			doneCount: 0,
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
		});
	});

	it("rejects an invalid name with the field and error code", async () => {
		const response = await api("/v1/lists", {
			method: "POST",
			cookie: alice,
			body: { name: " " },
		});

		expect(response.status).toBe(422);
		expect(await response.json()).toEqual({
			error: {
				code: "validation_error",
				message: "Invalid request",
				details: [{ field: "name", message: "list_name_required" }],
			},
		});
	});

	it("rejects a malformed JSON body", async () => {
		const response = await api("/v1/lists", {
			method: "POST",
			cookie: alice,
			body: undefined,
		});

		expect(response.status).toBeGreaterThanOrEqual(400);
		expect(response.status).toBeLessThan(500);
	});
});

describe("GET /v1/lists", () => {
	it("returns only the user's lists, newest first, with item counts", async () => {
		const groceries = await createList(alice, "Groceries");
		const chores = await createList(alice, "Chores");
		await api(`/v1/lists/${groceries.id}/items/batch`, {
			method: "POST",
			cookie: alice,
			body: { labels: ["Milk", "Eggs"] },
		});
		const [milk] = (
			await json<Paginated<Item>>(
				await api(`/v1/lists/${groceries.id}/items`, { cookie: alice }),
			)
		).data;
		await api(`/v1/lists/${groceries.id}/items/${milk?.id}`, {
			method: "PATCH",
			cookie: alice,
			body: { done: true },
		});

		const bob = await signIn("bob@example.com");
		await createList(bob, "Bob's list");

		const response = await api("/v1/lists", { cookie: alice });

		expect(response.status).toBe(200);
		const body = await json<Paginated<List>>(response);
		expect(body.data.map((list) => list.name)).toEqual(["Chores", "Groceries"]);
		expect(body.data[1]).toMatchObject({
			id: groceries.id,
			itemCount: 2,
			doneCount: 1,
		});
		expect(body.data[0]).toMatchObject({ id: chores.id, itemCount: 0 });
		expect(body.pagination).toEqual({ page: 1, pageSize: 50, total: 2 });
	});

	it("includes lists shared with the user, with their role", async () => {
		const bob = await signIn("bob@example.com");
		const shared = await createList(bob, "Shared");
		await joinList(shared.id, "alice@example.com", "viewer");

		const body = await json<Paginated<List>>(
			await api("/v1/lists", { cookie: alice }),
		);

		expect(body.data).toEqual([
			expect.objectContaining({ id: shared.id, role: "viewer" }),
		]);
	});

	it("paginates", async () => {
		await createList(alice, "First");
		await createList(alice, "Second");
		await createList(alice, "Third");

		const body = await json<Paginated<List>>(
			await api("/v1/lists?page=2&pageSize=2", { cookie: alice }),
		);

		expect(body.data.map((list) => list.name)).toEqual(["First"]);
		expect(body.pagination).toEqual({ page: 2, pageSize: 2, total: 3 });
	});

	it("rejects a page size above the maximum", async () => {
		const response = await api("/v1/lists?pageSize=1000", { cookie: alice });

		expect(response.status).toBe(422);
	});
});

describe("GET /v1/lists/:listId", () => {
	it("returns the list to a member", async () => {
		const list = await createList(alice);
		const bob = await joinList(list.id, "bob@example.com", "viewer");

		const response = await api(`/v1/lists/${list.id}`, { cookie: bob });

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			id: list.id,
			role: "viewer",
		});
	});

	it("answers 404 to a non-member, an unknown list or an invalid id", async () => {
		const list = await createList(alice);
		const bob = await signIn("bob@example.com");

		for (const path of [
			`/v1/lists/${list.id}`,
			"/v1/lists/00000000-0000-4000-8000-000000000000",
			"/v1/lists/not-a-uuid",
		]) {
			const response = await api(path, { cookie: bob });
			expect(response.status, path).toBe(404);
			expect(await response.json()).toEqual({
				error: { code: "list_not_found", message: "List not found" },
			});
		}
	});
});

describe("PATCH /v1/lists/:listId", () => {
	it("lets an editor rename the list", async () => {
		const list = await createList(alice);
		const bob = await joinList(list.id, "bob@example.com", "editor");

		const response = await api(`/v1/lists/${list.id}`, {
			method: "PATCH",
			cookie: bob,
			body: { name: "Weekend groceries" },
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			name: "Weekend groceries",
			role: "editor",
		});
	});

	it("forbids a viewer to rename the list", async () => {
		const list = await createList(alice);
		const bob = await joinList(list.id, "bob@example.com", "viewer");

		const response = await api(`/v1/lists/${list.id}`, {
			method: "PATCH",
			cookie: bob,
			body: { name: "Mine now" },
		});

		expect(response.status).toBe(403);
		expect((await json<ErrorBody>(response)).error.code).toBe("forbidden");
	});
});

describe("DELETE /v1/lists/:listId", () => {
	it("lets the owner delete the list and its items", async () => {
		const list = await createList(alice);
		await api(`/v1/lists/${list.id}/items`, {
			method: "POST",
			cookie: alice,
			body: { label: "Milk" },
		});

		const response = await api(`/v1/lists/${list.id}`, {
			method: "DELETE",
			cookie: alice,
		});

		expect(response.status).toBe(204);
		expect((await api(`/v1/lists/${list.id}`, { cookie: alice })).status).toBe(
			404,
		);
	});

	it("forbids an editor to delete the list", async () => {
		const list = await createList(alice);
		const bob = await joinList(list.id, "bob@example.com", "editor");

		const response = await api(`/v1/lists/${list.id}`, {
			method: "DELETE",
			cookie: bob,
		});

		expect(response.status).toBe(403);
	});
});
