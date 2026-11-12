import type { ItemStatus, ItemWithList, MemberRole } from "@repo/schemas";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AllItemsPage } from "@/features/items/AllItemsPage";
import type { ApiResponse } from "@/test/mock-api";
import { mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

const date = "2026-11-10T08:00:00.000Z";
const groceries = "0b7e3f4a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const hardware = "7c6d5e4f-3a2b-4c1d-9e8f-7a6b5c4d3e2f";
const lists: Record<string, { name: string; role: MemberRole }> = {
	[groceries]: { name: "Groceries", role: "owner" },
	[hardware]: { name: "Hardware", role: "viewer" },
};

function makeItem(
	position: number,
	label: string,
	listId: string,
	done = false,
): ItemWithList {
	return {
		id: `00000000-0000-4000-8000-${String(position).padStart(12, "0")}`,
		listId,
		label,
		done,
		doneAt: done ? date : null,
		doneById: null,
		position,
		createdById: null,
		createdAt: date,
		updatedAt: date,
		list: { id: listId, ...(lists[listId] ?? { name: "", role: "owner" }) },
	};
}

/** An in-memory API for the user's items, filtered like the real one. */
function serveItems(items: ItemWithList[]) {
	let stored = items;
	let failure: number | undefined;
	const requests = mockApi(
		({ method, path, body }, url): ApiResponse | undefined => {
			if (method === "GET" && path === "/items") {
				const status = url.searchParams.get("status") ?? "open";
				const data = stored.filter(
					(item) => status === "all" || (status === "checked") === item.done,
				);
				return {
					status: 200,
					body: {
						data,
						pagination: { page: 1, pageSize: 200, total: data.length },
					},
				};
			}
			const itemPath = path.match(/^\/lists\/[^/]+\/items\/([^/]+)$/);
			if (method === "PATCH" && itemPath) {
				if (failure !== undefined) {
					const status = failure;
					failure = undefined;
					return {
						status,
						body: { error: { code: "internal_error", message: "" } },
					};
				}
				const done = Boolean((body as { done: boolean }).done);
				stored = stored.map((item) =>
					item.id === itemPath[1] ? { ...item, done } : item,
				);
				return {
					status: 200,
					body: stored.find((item) => item.id === itemPath[1]),
				};
			}
			return undefined;
		},
	);
	return { requests, failNext: (status: number) => (failure = status) };
}

function FilteredPage({ initial }: { initial: ItemStatus }) {
	const [status, setStatus] = useState(initial);
	return <AllItemsPage status={status} onStatusChange={setStatus} />;
}

function renderPage(initial: ItemStatus = "open") {
	renderWithRouter(<FilteredPage initial={initial} />);
	return userEvent.setup();
}

function shownLabels() {
	return screen
		.queryAllByRole("checkbox")
		.map(
			(box) =>
				document.getElementById(box.getAttribute("aria-labelledby") ?? "")
					?.textContent,
		);
}

const items = [
	makeItem(1, "Milk", groceries, true),
	makeItem(2, "Eggs", groceries),
	makeItem(3, "Nails", hardware),
	makeItem(4, "Screws", hardware, true),
];

describe("AllItemsPage", () => {
	it("shows the items to do by default, grouped by list", async () => {
		serveItems(items);
		renderPage();

		const group = await screen.findByRole("region", { name: "Groceries" });
		expect(within(group).getByRole("checkbox", { name: "Eggs" })).toBeVisible();
		expect(
			within(group).getByRole("link", { name: "Groceries" }),
		).toHaveAttribute("href", `/lists/${groceries}`);
		expect(shownLabels()).toEqual(["Eggs", "Nails"]);
		expect(screen.getByRole("button", { name: "To do" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("switches to the checked items, then to all of them", async () => {
		serveItems(items);
		const user = renderPage();
		await screen.findByRole("checkbox", { name: "Eggs" });

		await user.click(screen.getByRole("button", { name: "Checked" }));
		expect(await screen.findByRole("checkbox", { name: "Milk" })).toBeChecked();
		expect(shownLabels()).toEqual(["Milk", "Screws"]);

		await user.click(screen.getByRole("button", { name: "All" }));
		await screen.findByRole("checkbox", { name: "Eggs" });
		expect(shownLabels()).toEqual(["Milk", "Eggs", "Nails", "Screws"]);
	});

	it("checks an item, which leaves the items to do at once", async () => {
		const { requests } = serveItems(items);
		const user = renderPage();

		await user.click(await screen.findByRole("checkbox", { name: "Eggs" }));

		expect(screen.queryByRole("checkbox", { name: "Eggs" })).toBeNull();
		await vi.waitFor(() =>
			expect(requests).toContainEqual({
				method: "PATCH",
				path: `/lists/${groceries}/items/${items[1]?.id}`,
				body: { done: true },
			}),
		);
	});

	it("puts the item back when the API refuses the change, and says so", async () => {
		const server = serveItems(items);
		const user = renderPage();
		await screen.findByRole("checkbox", { name: "Eggs" });

		server.failNext(500);
		await user.click(screen.getByRole("checkbox", { name: "Eggs" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Your change couldn't be saved. Try again.",
		);
		expect(screen.getByRole("checkbox", { name: "Eggs" })).not.toBeChecked();
	});

	it("doesn't let a viewer check the items of a shared list", async () => {
		serveItems(items);
		renderPage();

		expect(
			await screen.findByRole("checkbox", { name: "Nails" }),
		).toBeDisabled();
		expect(screen.getByRole("checkbox", { name: "Eggs" })).toBeEnabled();
	});

	it("says when there is nothing left to do", async () => {
		serveItems([makeItem(1, "Milk", groceries, true)]);
		renderPage();

		expect(await screen.findByText("Nothing left to do.")).toBeVisible();
	});
});
