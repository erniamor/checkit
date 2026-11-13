import type { Item, List, Member, Paginated, ShareLink } from "@repo/schemas";
import { api, createList, joinList, json } from "@test/helpers/api";
import { signIn } from "@test/helpers/auth";
import { type EventStream, openEventStream } from "@test/helpers/events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listEvents } from "@/realtime/list-events";

let alice: string;
let bob: string;
let list: List;
const streams: EventStream[] = [];

beforeEach(async () => {
	alice = await signIn("alice@example.com");
	list = await createList(alice, "Groceries");
	bob = await joinList(list.id, "bob@example.com", "editor");
});

afterEach(async () => {
	await Promise.all(streams.splice(0).map((stream) => stream.close()));
	vi.restoreAllMocks();
});

/** Opens the list's stream as `cookie` and waits for it to be ready. */
async function listen(cookie: string, listId = list.id) {
	const stream = await openEventStream(listId, cookie);
	streams.push(stream);
	expect(stream.response.status).toBe(200);
	expect(await stream.nextMessage()).toEqual({
		event: "ready",
		data: JSON.stringify({ listId }),
	});
	return stream;
}

async function userIdOf(email: string): Promise<string> {
	const members = await json<Paginated<Member>>(
		await api(`/v1/lists/${list.id}/members`, { cookie: alice }),
	);
	return members.data.find((member) => member.email === email)?.userId ?? "";
}

async function addItem(label: string, cookie = alice): Promise<Item> {
	return json<Item>(
		await api(`/v1/lists/${list.id}/items`, {
			method: "POST",
			cookie,
			body: { label },
		}),
	);
}

describe("GET /v1/lists/:listId/events", () => {
	it("opens a Server-Sent Events stream", async () => {
		const stream = await listen(bob);

		expect(stream.response.headers.get("Content-Type")).toMatch(
			/^text\/event-stream/,
		);
	});

	it("requires a session and membership", async () => {
		const carol = await signIn("carol@example.com");

		expect((await openEventStream(list.id)).response.status).toBe(401);
		expect((await openEventStream(list.id, carol)).response.status).toBe(404);
	});

	it("pushes item changes made by another member", async () => {
		const stream = await listen(bob);

		const milk = await addItem("Milk");
		const created = await stream.nextEvent();
		expect(created).toEqual({
			type: "items.created",
			listId: list.id,
			actorId: milk.createdById,
			items: [milk],
		});

		await api(`/v1/lists/${list.id}/items/${milk.id}`, {
			method: "PATCH",
			cookie: alice,
			body: { done: true },
		});
		expect(await stream.nextEvent()).toMatchObject({
			type: "item.updated",
			item: { id: milk.id, done: true },
		});

		await api(`/v1/lists/${list.id}/items/${milk.id}`, {
			method: "DELETE",
			cookie: alice,
		});
		expect(await stream.nextEvent()).toMatchObject({
			type: "item.deleted",
			itemId: milk.id,
		});
	});

	it("pushes items added in a batch as one event", async () => {
		const stream = await listen(alice);

		await api(`/v1/lists/${list.id}/items/batch`, {
			method: "POST",
			cookie: bob,
			body: { labels: ["Milk", "Eggs", "Bread"] },
		});

		const event = await stream.nextEvent();
		expect(event.type === "items.created" && event.items).toHaveLength(3);
		expect(event.actorId).toBe(await userIdOf("bob@example.com"));
	});

	it("pushes every checked item as one event, and nothing when none changes", async () => {
		const milk = await addItem("Milk");
		const eggs = await addItem("Eggs");
		const stream = await listen(alice);

		await api(`/v1/lists/${list.id}/items`, {
			method: "PATCH",
			cookie: bob,
			body: { done: true },
		});
		const event = await stream.nextEvent();
		expect(event).toMatchObject({
			type: "items.updated",
			actorId: await userIdOf("bob@example.com"),
			items: [
				{ id: milk.id, done: true },
				{ id: eggs.id, done: true },
			],
		});

		// Already all checked: nothing written, nothing pushed
		await api(`/v1/lists/${list.id}/items`, {
			method: "PATCH",
			cookie: bob,
			body: { done: true },
		});
		await addItem("Bread");
		expect((await stream.nextEvent()).type).toBe("items.created");
	});

	it("pushes a checked item unchecked by adding its label again", async () => {
		const milk = await addItem("Milk");
		await api(`/v1/lists/${list.id}/items/${milk.id}`, {
			method: "PATCH",
			cookie: alice,
			body: { done: true },
		});
		const stream = await listen(bob);

		await addItem("milk");

		expect(await stream.nextEvent()).toMatchObject({
			type: "items.updated",
			items: [{ id: milk.id, done: false }],
		});
	});

	it("pushes the list's new name", async () => {
		const stream = await listen(bob);

		await api(`/v1/lists/${list.id}`, {
			method: "PATCH",
			cookie: alice,
			body: { name: "Weekend groceries" },
		});

		expect(await stream.nextEvent()).toMatchObject({
			type: "list.updated",
			name: "Weekend groceries",
		});
	});

	it("pushes membership changes", async () => {
		const stream = await listen(alice);
		const link = await json<ShareLink>(
			await api(`/v1/lists/${list.id}/share-links`, {
				method: "POST",
				cookie: alice,
				body: { role: "viewer" },
			}),
		);
		const carol = await signIn("carol@example.com");

		await api(`/v1/share-links/${link.token}/join`, {
			method: "POST",
			cookie: carol,
		});
		expect(await stream.nextEvent()).toMatchObject({
			type: "member.added",
			member: { email: "carol@example.com", role: "viewer" },
		});

		const carolId = await userIdOf("carol@example.com");
		await api(`/v1/lists/${list.id}/members/${carolId}`, {
			method: "PATCH",
			cookie: alice,
			body: { role: "editor" },
		});
		expect(await stream.nextEvent()).toMatchObject({
			type: "member.updated",
			member: { email: "carol@example.com", role: "editor" },
		});
	});

	it("doesn't push anything when joining changes nothing", async () => {
		const stream = await listen(alice);
		const link = await json<ShareLink>(
			await api(`/v1/lists/${list.id}/share-links`, {
				method: "POST",
				cookie: alice,
				body: { role: "viewer" },
			}),
		);

		// Bob is already editor: the viewer link leaves him as is
		await api(`/v1/share-links/${link.token}/join`, {
			method: "POST",
			cookie: bob,
		});
		await addItem("Milk");

		expect((await stream.nextEvent()).type).toBe("items.created");
	});

	it("only pushes the events of the list listened to", async () => {
		const other = await createList(alice, "Other");
		const stream = await listen(alice);

		await api(`/v1/lists/${other.id}/items`, {
			method: "POST",
			cookie: alice,
			body: { label: "Elsewhere" },
		});
		await addItem("Milk");

		const event = await stream.nextEvent();
		expect(event.type === "items.created" && event.items[0]?.label).toBe(
			"Milk",
		);
	});

	it("ends the stream of a member who is removed", async () => {
		const stream = await listen(bob);

		await api(
			`/v1/lists/${list.id}/members/${await userIdOf("bob@example.com")}`,
			{ method: "DELETE", cookie: alice },
		);

		expect(await stream.nextEvent()).toMatchObject({
			type: "member.removed",
		});
		expect(await stream.nextMessage()).toBeNull();
	});

	it("keeps the stream of the other members when someone leaves", async () => {
		const stream = await listen(alice);

		await api(`/v1/lists/${list.id}/members/me`, {
			method: "DELETE",
			cookie: bob,
		});
		await addItem("Milk");

		expect((await stream.nextEvent()).type).toBe("member.removed");
		expect((await stream.nextEvent()).type).toBe("items.created");
	});

	it("stops listening when the client disconnects", async () => {
		const stream = await listen(bob);
		expect(listEvents.listenerCount(list.id)).toBe(1);

		await stream.close();

		await vi.waitFor(() => expect(listEvents.listenerCount(list.id)).toBe(0));
	});

	it("ends every stream when the list is deleted", async () => {
		const stream = await listen(bob);

		await api(`/v1/lists/${list.id}`, { method: "DELETE", cookie: alice });

		expect((await stream.nextEvent()).type).toBe("list.deleted");
		expect(await stream.nextMessage()).toBeNull();
	});
});
