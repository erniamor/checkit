import type {
	Item,
	ItemsBatchResult,
	ItemWithList,
	List,
	Paginated,
} from "@repo/schemas";
import { api, createList, joinList, json } from "@test/helpers/api";
import { signIn } from "@test/helpers/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ErrorBody } from "@/lib/errors";

let alice: string;
let list: List;

beforeEach(async () => {
	alice = await signIn("alice@example.com");
	list = await createList(alice);
});

afterEach(() => {
	vi.restoreAllMocks();
});

function itemsPath(path = "") {
	return `/v1/lists/${list.id}/items${path}`;
}

async function addItem(label: string, cookie = alice): Promise<Item> {
	const response = await api(itemsPath(), {
		method: "POST",
		cookie,
		body: { label },
	});
	return json<Item>(response);
}

async function listed(cookie = alice): Promise<Item[]> {
	return (await json<Paginated<Item>>(await api(itemsPath(), { cookie }))).data;
}

async function labels(cookie = alice): Promise<string[]> {
	return (await listed(cookie)).map((item) => item.label);
}

async function patchItem(itemId: string, body: unknown, cookie = alice) {
	return api(itemsPath(`/${itemId}`), { method: "PATCH", cookie, body });
}

describe("POST /v1/lists/:listId/items", () => {
	it("appends items at the end of the list", async () => {
		const response = await api(itemsPath(), {
			method: "POST",
			cookie: alice,
			body: { label: " Milk " },
		});

		expect(response.status).toBe(201);
		const milk = await json<Item>(response);
		expect(milk).toEqual({
			id: expect.any(String),
			listId: list.id,
			label: "Milk",
			done: false,
			doneAt: null,
			doneById: null,
			position: 1,
			createdById: expect.any(String),
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
		});

		const eggs = await addItem("Eggs");
		expect(eggs.position).toBeGreaterThan(milk.position);
		expect(await labels()).toEqual(["Milk", "Eggs"]);
	});

	it("rejects an empty label", async () => {
		const response = await api(itemsPath(), {
			method: "POST",
			cookie: alice,
			body: { label: "" },
		});

		expect(response.status).toBe(422);
		expect((await json<ErrorBody>(response)).error.details).toEqual([
			{ field: "label", message: "item_label_required" },
		]);
	});
});

describe("duplicate labels", () => {
	async function post(label: string, cookie = alice) {
		return api(itemsPath(), { method: "POST", cookie, body: { label } });
	}

	it("refuses an item the list already has to do, case and spaces aside", async () => {
		await addItem("Oat milk");

		const response = await post("  oat   MILK ");

		expect(response.status).toBe(409);
		expect((await json<ErrorBody>(response)).error).toMatchObject({
			code: "item_label_taken",
			details: [{ field: "label", message: "item_label_taken" }],
		});
		expect(await labels()).toEqual(["Oat milk"]);
	});

	it("unchecks a checked item instead of adding it again", async () => {
		const milk = await addItem("Milk");
		await patchItem(milk.id, { done: true });

		const response = await post("milk");

		expect(response.status).toBe(200);
		expect(await json<Item>(response)).toMatchObject({
			id: milk.id,
			label: "Milk",
			done: false,
			doneAt: null,
		});
		expect(await labels()).toEqual(["Milk"]);
	});

	it("tells accents apart, and other lists", async () => {
		await addItem("Pâtes");
		const other = await createList(alice, "Other");

		expect((await post("Pates")).status).toBe(201);
		expect(
			(
				await api(`/v1/lists/${other.id}/items`, {
					method: "POST",
					cookie: alice,
					body: { label: "Pâtes" },
				})
			).status,
		).toBe(201);
	});

	it("refuses renaming an item with another item's label", async () => {
		await addItem("Milk");
		const eggs = await addItem("Eggs");

		const response = await patchItem(eggs.id, { label: "MILK" });

		expect(response.status).toBe(409);
		expect(await labels()).toEqual(["Milk", "Eggs"]);
	});

	it("lets an item keep its label, with another case", async () => {
		const milk = await addItem("milk");

		const response = await patchItem(milk.id, { label: "Milk" });

		expect(response.status).toBe(200);
		expect((await json<Item>(response)).label).toBe("Milk");
	});

	it("adds the same label only once, even at the same time", async () => {
		const bob = await joinList(list.id, "bob@example.com", "editor");

		const statuses = await Promise.all([
			post("Bread"),
			post("bread", bob),
			post("BREAD"),
		]).then((responses) => responses.map((response) => response.status));

		expect(statuses.sort()).toEqual([201, 409, 409]);
		expect(await labels()).toEqual(["Bread"]);
	});
});

describe("POST /v1/lists/:listId/items/batch", () => {
	it("skips duplicates and unchecks checked items, saying which", async () => {
		await addItem("Eggs");
		const milk = await addItem("Milk");
		await patchItem(milk.id, { done: true });

		const response = await api(itemsPath("/batch"), {
			method: "POST",
			cookie: alice,
			body: { labels: ["Bread", "eggs", "milk", "bread", "Butter"] },
		});

		expect(response.status).toBe(201);
		const body = await json<ItemsBatchResult>(response);
		expect(body.data.map((item) => item.label)).toEqual(["Bread", "Butter"]);
		expect(body.restored).toEqual([
			expect.objectContaining({ id: milk.id, done: false }),
		]);
		expect(body.skipped).toEqual(["eggs", "bread"]);
		expect(await labels()).toEqual(["Eggs", "Milk", "Bread", "Butter"]);
	});

	it("adds several items in order, after the existing ones", async () => {
		await addItem("Coffee");

		const response = await api(itemsPath("/batch"), {
			method: "POST",
			cookie: alice,
			body: { labels: ["Milk", "Eggs", "Bread"] },
		});

		expect(response.status).toBe(201);
		const body = await json<{ data: Item[] }>(response);
		expect(body.data.map((item) => item.label)).toEqual([
			"Milk",
			"Eggs",
			"Bread",
		]);
		expect(await labels()).toEqual(["Coffee", "Milk", "Eggs", "Bread"]);
	});

	it("keeps every item when additions run concurrently", async () => {
		await Promise.all(
			["A", "B", "C", "D"].map((label) =>
				api(itemsPath("/batch"), {
					method: "POST",
					cookie: alice,
					body: { labels: [`${label}1`, `${label}2`] },
				}),
			),
		);

		const positions = (await listed()).map((item) => item.position);
		expect(positions).toHaveLength(8);
		expect(new Set(positions).size).toBe(8);
	});
});

describe("PATCH /v1/lists/:listId/items/:itemId", () => {
	it("checks an item, recording who checked it and when", async () => {
		const milk = await addItem("Milk");
		const bob = await joinList(list.id, "bob@example.com", "editor");

		const response = await patchItem(milk.id, { done: true }, bob);

		expect(response.status).toBe(200);
		const checked = await json<Item>(response);
		expect(checked.done).toBe(true);
		expect(checked.doneAt).toEqual(expect.any(String));
		expect(checked.doneById).not.toBe(checked.createdById);
	});

	it("keeps the original check when an item is checked again", async () => {
		const milk = await addItem("Milk");
		const first = await json<Item>(await patchItem(milk.id, { done: true }));

		const second = await json<Item>(await patchItem(milk.id, { done: true }));

		expect(second.doneAt).toBe(first.doneAt);
	});

	it("clears the check when an item is unchecked", async () => {
		const milk = await addItem("Milk");
		await api(itemsPath(`/${milk.id}`), {
			method: "PATCH",
			cookie: alice,
			body: { done: true },
		});

		const response = await api(itemsPath(`/${milk.id}`), {
			method: "PATCH",
			cookie: alice,
			body: { done: false },
		});

		expect(await response.json()).toMatchObject({
			done: false,
			doneAt: null,
			doneById: null,
		});
	});

	it("renames an item", async () => {
		const milk = await addItem("Milk");

		const response = await patchItem(milk.id, { label: "Oat milk" });

		expect((await json<Item>(response)).label).toBe("Oat milk");
	});

	it("moves an item between two others", async () => {
		const milk = await addItem("Milk");
		const eggs = await addItem("Eggs");
		const bread = await addItem("Bread");

		await patchItem(bread.id, {
			position: (milk.position + eggs.position) / 2,
		});

		expect(await labels()).toEqual(["Milk", "Bread", "Eggs"]);
	});

	it("rejects an empty change", async () => {
		const milk = await addItem("Milk");

		const response = await api(itemsPath(`/${milk.id}`), {
			method: "PATCH",
			cookie: alice,
			body: {},
		});

		expect(response.status).toBe(422);
		expect((await json<ErrorBody>(response)).error.details).toEqual([
			{ field: "", message: "nothing_to_update" },
		]);
	});

	it("rejects an invalid item id", async () => {
		const response = await api(itemsPath("/not-a-uuid"), {
			method: "PATCH",
			cookie: alice,
			body: { done: true },
		});

		expect(response.status).toBe(422);
	});

	it("answers 404 for an item of another list", async () => {
		const other = await createList(alice, "Other");
		const foreign = await json<Item>(
			await api(`/v1/lists/${other.id}/items`, {
				method: "POST",
				cookie: alice,
				body: { label: "Elsewhere" },
			}),
		);

		const response = await api(itemsPath(`/${foreign.id}`), {
			method: "PATCH",
			cookie: alice,
			body: { done: true },
		});

		expect(response.status).toBe(404);
		expect((await json<ErrorBody>(response)).error.code).toBe("item_not_found");
	});
});

describe("PATCH /v1/lists/:listId/items", () => {
	async function patchAll(body: unknown, cookie = alice) {
		return api(itemsPath(), { method: "PATCH", cookie, body });
	}

	it("checks every item, returning only the ones that changed", async () => {
		const milk = await addItem("Milk");
		const eggs = await addItem("Eggs");
		const bread = await addItem("Bread");
		const before = await json<Item>(await patchItem(eggs.id, { done: true }));
		const bob = await joinList(list.id, "bob@example.com", "editor");

		const response = await patchAll({ done: true }, bob);

		expect(response.status).toBe(200);
		const { data } = await json<{ data: Item[] }>(response);
		expect(data.map((item) => item.id)).toEqual([milk.id, bread.id]);
		expect(data[0]?.doneById).not.toBe(milk.createdById);
		const all = await listed();
		expect(all.every((item) => item.done)).toBe(true);
		// The item already checked keeps who checked it, and when
		expect(all.find((item) => item.id === eggs.id)).toMatchObject({
			doneAt: before.doneAt,
			doneById: before.doneById,
		});
	});

	it("unchecks every item", async () => {
		const milk = await addItem("Milk");
		await addItem("Eggs");
		await patchItem(milk.id, { done: true });

		const response = await patchAll({ done: false });

		const { data } = await json<{ data: Item[] }>(response);
		expect(data).toEqual([
			expect.objectContaining({
				id: milk.id,
				done: false,
				doneAt: null,
				doneById: null,
			}),
		]);
		expect((await listed()).some((item) => item.done)).toBe(false);
	});

	it("leaves the items of other lists alone", async () => {
		const other = await createList(alice, "Other");
		await api(`/v1/lists/${other.id}/items`, {
			method: "POST",
			cookie: alice,
			body: { label: "Elsewhere" },
		});

		await patchAll({ done: true });

		const elsewhere = await json<Paginated<Item>>(
			await api(`/v1/lists/${other.id}/items`, { cookie: alice }),
		);
		expect(elsewhere.data[0]?.done).toBe(false);
	});

	it("rejects a missing state", async () => {
		const response = await patchAll({});

		expect(response.status).toBe(422);
	});
});

describe("DELETE /v1/lists/:listId/items/:itemId", () => {
	it("deletes an item", async () => {
		const milk = await addItem("Milk");

		const response = await api(itemsPath(`/${milk.id}`), {
			method: "DELETE",
			cookie: alice,
		});

		expect(response.status).toBe(204);
		expect(await labels()).toEqual([]);
		expect(
			(
				await api(itemsPath(`/${milk.id}`), {
					method: "DELETE",
					cookie: alice,
				})
			).status,
		).toBe(404);
	});
});

describe("GET /v1/items", () => {
	async function myItems(query = "", cookie = alice) {
		return api(`/v1/items${query}`, { cookie });
	}

	async function myLabels(query = "", cookie = alice): Promise<string[]> {
		const body = await json<Paginated<ItemWithList>>(
			await myItems(query, cookie),
		);
		return body.data.map((item) => item.label);
	}

	it("lists the items to do of every list, grouped by list", async () => {
		const milk = await addItem("Milk");
		await addItem("Eggs");
		await patchItem(milk.id, { done: true });
		const bob = await signIn("bob@example.com");
		const shared = await createList(bob, "Hardware");
		await api(`/v1/lists/${shared.id}/items`, {
			method: "POST",
			cookie: bob,
			body: { label: "Nails" },
		});
		await joinList(shared.id, "alice@example.com", "viewer");

		const response = await myItems();

		expect(response.status).toBe(200);
		const body = await json<Paginated<ItemWithList>>(response);
		expect(body.pagination).toEqual({ page: 1, pageSize: 100, total: 2 });
		// The most recent list first, as on "My lists"
		expect(
			body.data.map((item) => [item.label, item.list.name, item.list.role]),
		).toEqual([
			["Nails", "Hardware", "viewer"],
			["Eggs", list.name, "owner"],
		]);
	});

	it("filters the checked items, or shows them all", async () => {
		const milk = await addItem("Milk");
		await addItem("Eggs");
		await patchItem(milk.id, { done: true });

		expect(await myLabels("?status=checked")).toEqual(["Milk"]);
		expect(await myLabels("?status=all")).toEqual(["Milk", "Eggs"]);
	});

	it("hides the items of lists the user isn't a member of", async () => {
		await addItem("Milk");
		const bob = await signIn("bob@example.com");

		expect(await myLabels("?status=all", bob)).toEqual([]);
	});

	it("rejects an unknown status, and a visitor", async () => {
		expect((await myItems("?status=done")).status).toBe(422);
		expect((await api("/v1/items")).status).toBe(401);
	});
});

describe("access by role", () => {
	it("lets a viewer read the items but not change them", async () => {
		const milk = await addItem("Milk");
		const bob = await joinList(list.id, "bob@example.com", "viewer");

		expect(await labels(bob)).toEqual(["Milk"]);
		for (const [method, path, body] of [
			["POST", itemsPath(), { label: "Eggs" }],
			["POST", itemsPath("/batch"), { labels: ["Eggs"] }],
			["PATCH", itemsPath(`/${milk.id}`), { done: true }],
			["PATCH", itemsPath(), { done: true }],
			["DELETE", itemsPath(`/${milk.id}`), undefined],
		] as const) {
			const response = await api(path, { method, cookie: bob, body });
			expect(response.status, `${method} ${path}`).toBe(403);
		}
	});

	it("hides the items from a non-member", async () => {
		await addItem("Milk");
		const bob = await signIn("bob@example.com");

		const response = await api(itemsPath(), { cookie: bob });

		expect(response.status).toBe(404);
	});
});
