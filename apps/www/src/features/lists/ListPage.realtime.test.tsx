import { Toaster } from "@repo/ui";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListLive } from "@/features/lists/ListLive";
import { ListPage } from "@/features/lists/ListPage";
import { FakeEventSource } from "@/test/fake-event-source";
import {
	fakeListServer,
	listId,
	meId,
	otherUserId,
} from "@/test/fake-list-server";
import { mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

afterEach(() => {
	FakeEventSource.instances = [];
});

/** Renders the list and waits until its stream is ready. */
async function renderLive(server: ReturnType<typeof fakeListServer>) {
	const requests = mockApi(server.respond);
	const result = renderWithRouter(
		<>
			<ListLive listId={listId} meId={meId}>
				<ListPage listId={listId} />
			</ListLive>
			<Toaster />
		</>,
	);
	await screen.findByRole("heading", { level: 1 });
	const stream = FakeEventSource.latest();
	act(() => stream.emit("ready", { listId }));
	return { ...result, requests, stream };
}

function emit(stream: FakeEventSource, event: Record<string, unknown>) {
	act(() => stream.emit(String(event.type), { listId, ...event }));
}

describe("ListPage in real time", () => {
	it("listens to the list's stream with the session cookie", async () => {
		const { stream } = await renderLive(fakeListServer());

		expect(stream.url).toBe(`http://api.test/v1/lists/${listId}/events`);
	});

	it("shows the items another member adds, checks and deletes", async () => {
		const server = fakeListServer({ items: ["Milk"] });
		const { stream } = await renderLive(server);

		const eggs = server.other.addItem("Eggs");
		emit(stream, {
			type: "items.created",
			actorId: otherUserId,
			items: [eggs],
		});
		expect(await screen.findByRole("checkbox", { name: "Eggs" })).toBeVisible();

		const milk = server.other.updateItem(server.item(1).id, { done: true });
		emit(stream, { type: "item.updated", actorId: otherUserId, item: milk });
		await vi.waitFor(() =>
			expect(screen.getByRole("checkbox", { name: "Milk" })).toBeChecked(),
		);

		server.other.removeItem(eggs.id);
		emit(stream, {
			type: "item.deleted",
			actorId: otherUserId,
			itemId: eggs.id,
		});
		await vi.waitFor(() =>
			expect(screen.queryByRole("checkbox", { name: "Eggs" })).toBeNull(),
		);
	});

	it("doesn't show my own addition twice", async () => {
		const server = fakeListServer();
		const { stream } = await renderLive(server);
		const user = userEvent.setup();

		await user.type(screen.getByLabelText("New item"), "Coffee{Enter}");
		await vi.waitFor(() => expect(server.labels()).toEqual(["Coffee"]));
		emit(stream, {
			type: "items.created",
			actorId: meId,
			items: [server.item(1)],
		});

		await vi.waitFor(() =>
			expect(screen.getAllByRole("checkbox", { name: "Coffee" })).toHaveLength(
				1,
			),
		);
	});

	it("follows another member's change of kind", async () => {
		const server = fakeListServer();
		const { stream } = await renderLive(server);
		await screen.findByLabelText("New item");

		server.other.changeKind("tasks");
		emit(stream, {
			type: "list.updated",
			actorId: otherUserId,
			name: "Groceries",
			kind: "tasks",
			updatedAt: "2026-11-10T09:00:00.000Z",
		});

		expect(await screen.findByLabelText("New task")).toBeVisible();
	});

	it("shows the list's new name", async () => {
		const server = fakeListServer();
		const { stream } = await renderLive(server);

		server.other.renameList("Weekend");
		emit(stream, {
			type: "list.updated",
			actorId: otherUserId,
			name: "Weekend",
			kind: "purchases",
			updatedAt: "2026-11-10T09:00:00.000Z",
		});

		expect(
			await screen.findByRole("heading", { level: 1, name: "Weekend" }),
		).toBeVisible();
	});

	it("turns the page read only when my role becomes viewer", async () => {
		const server = fakeListServer({ items: ["Milk"] });
		const { stream } = await renderLive(server);
		expect(screen.getByLabelText("New item")).toBeVisible();

		server.other.changeMyRole("viewer");

		emit(stream, {
			type: "member.updated",
			actorId: otherUserId,
			member: {
				userId: meId,
				name: "Alice",
				email: "alice@example.com",
				image: null,
				role: "viewer",
				joinedAt: "2026-11-10T08:00:00.000Z",
			},
		});

		expect(await screen.findByText("Read only")).toBeVisible();
		expect(screen.queryByLabelText("New item")).toBeNull();
		expect(screen.getByRole("checkbox", { name: "Milk" })).toBeDisabled();
	});

	it("goes back to my lists when the list is deleted", async () => {
		const { stream, router } = await renderLive(fakeListServer());

		emit(stream, { type: "list.deleted", actorId: otherUserId });

		expect(await screen.findByText("“Groceries” was deleted.")).toBeVisible();
		await vi.waitFor(() =>
			expect(router.state.location.pathname).toBe("/lists"),
		);
	});

	it("goes back to my lists when I'm removed from the list", async () => {
		const { stream, router } = await renderLive(fakeListServer());

		emit(stream, {
			type: "member.removed",
			actorId: otherUserId,
			userId: meId,
		});

		expect(
			await screen.findByText("You no longer have access to “Groceries”."),
		).toBeVisible();
		await vi.waitFor(() =>
			expect(router.state.location.pathname).toBe("/lists"),
		);
	});

	it("stays on the page when another member leaves", async () => {
		const { stream, router } = await renderLive(fakeListServer());

		emit(stream, {
			type: "member.removed",
			actorId: otherUserId,
			userId: otherUserId,
		});

		expect(router.state.location.pathname).toBe("/");
	});

	it("says when it reconnects, then reloads the list", async () => {
		const server = fakeListServer({ items: ["Milk"] });
		const { stream, requests } = await renderLive(server);

		act(() => stream.fail());
		// By its text: the reordering also has a status region, for screen readers
		expect(screen.getByText("Connection lost, reconnecting…")).toHaveAttribute(
			"role",
			"status",
		);

		// A change made while disconnected, whose event is lost
		server.other.addItem("Eggs");
		const itemsLoads = () =>
			requests.filter((request) => request.path.endsWith("/items")).length;
		const before = itemsLoads();
		act(() => stream.emit("ready", { listId }));

		expect(await screen.findByRole("checkbox", { name: "Eggs" })).toBeVisible();
		expect(itemsLoads()).toBeGreaterThan(before);
		expect(screen.queryByText("Connection lost, reconnecting…")).toBeNull();
	});

	it("stops listening when leaving the page", async () => {
		const { stream, unmount } = await renderLive(fakeListServer());

		unmount();

		expect(stream.readyState).toBe(FakeEventSource.CLOSED);
	});
});
