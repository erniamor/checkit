import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListPage } from "@/features/lists/ListPage";
import { fakeListServer, listId } from "@/test/fake-list-server";
import { mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

function renderList(server: ReturnType<typeof fakeListServer>) {
	const requests = mockApi(server.respond);
	const result = renderWithRouter(<ListPage listId={listId} />);
	return { ...result, requests, user: userEvent.setup() };
}

/** Labels of the items to do, then of the checked ones, as displayed. */
function displayedItems() {
	const checkedSection = screen.queryByRole("region", { name: "Checked" });
	const checked = checkedSection
		? within(checkedSection)
				.getAllByRole("checkbox")
				.map((box) => box.getAttribute("aria-labelledby"))
		: [];
	const all = screen.getAllByRole("checkbox");
	const label = (box: HTMLElement) =>
		document.getElementById(box.getAttribute("aria-labelledby") ?? "")
			?.textContent;
	return {
		open: all
			.filter((box) => !checked.includes(box.getAttribute("aria-labelledby")))
			.map(label),
		checked: all
			.filter((box) => checked.includes(box.getAttribute("aria-labelledby")))
			.map(label),
	};
}

describe("ListPage", () => {
	it("shows the items to do, then the checked ones", async () => {
		renderList(fakeListServer({ items: ["Milk ✓", "Eggs", "Bread"] }));

		expect(
			await screen.findByRole("heading", { level: 1, name: "Groceries" }),
		).toBeVisible();
		expect(displayedItems()).toEqual({
			open: ["Eggs", "Bread"],
			checked: ["Milk"],
		});
	});

	it("checks an item at once, and saves it", async () => {
		const { user, requests } = renderList(
			fakeListServer({ items: ["Milk", "Eggs"] }),
		);

		await user.click(await screen.findByRole("checkbox", { name: "Milk" }));

		expect(screen.getByRole("checkbox", { name: "Milk" })).toBeChecked();
		expect(displayedItems()).toEqual({ open: ["Eggs"], checked: ["Milk"] });
		await vi.waitFor(() =>
			expect(requests).toContainEqual({
				method: "PATCH",
				path: `/lists/${listId}/items/00000000-0000-4000-8000-000000000001`,
				body: { done: true },
			}),
		);
	});

	it("undoes a change the API refuses, and says so", async () => {
		const server = fakeListServer({ items: ["Milk"] });
		const { user } = renderList(server);
		await screen.findByRole("checkbox", { name: "Milk" });

		server.failNext(500);
		await user.click(screen.getByRole("checkbox", { name: "Milk" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Your change couldn't be saved. Try again.",
		);
		await vi.waitFor(() =>
			expect(screen.getByRole("checkbox", { name: "Milk" })).not.toBeChecked(),
		);
	});

	it("adds an item, keeping the field ready for the next one", async () => {
		const server = fakeListServer();
		const { user } = renderList(server);
		expect(
			await screen.findByText("This list is empty. Add your first item."),
		).toBeVisible();

		const field = screen.getByLabelText("New item");
		await user.type(field, "Coffee{Enter}");

		expect(
			await screen.findByRole("checkbox", { name: "Coffee" }),
		).toBeVisible();
		expect(field).toHaveValue("");
		await vi.waitFor(() => expect(server.labels()).toEqual(["Coffee"]));
	});

	it("doesn't add an empty item", async () => {
		const { user, requests } = renderList(fakeListServer());

		await user.click(await screen.findByRole("button", { name: "Add" }));

		expect(screen.getByText("Enter the item.")).toBeVisible();
		expect(requests.filter((request) => request.method === "POST")).toEqual([]);
	});

	it("renames an item in place", async () => {
		const server = fakeListServer({ items: ["Milk"] });
		const { user } = renderList(server);

		await user.click(
			await screen.findByRole("button", { name: "Rename “Milk”" }),
		);
		const field = screen.getByLabelText("Rename “Milk”");
		await user.clear(field);
		await user.type(field, "Oat milk{Enter}");

		expect(
			await screen.findByRole("checkbox", { name: "Oat milk" }),
		).toBeVisible();
		await vi.waitFor(() => expect(server.labels()).toEqual(["Oat milk"]));
	});

	it("cancels a rename with Escape", async () => {
		const { user } = renderList(fakeListServer({ items: ["Milk"] }));

		await user.click(
			await screen.findByRole("button", { name: "Rename “Milk”" }),
		);
		await user.keyboard("{Escape}");

		expect(screen.getByRole("checkbox", { name: "Milk" })).toBeVisible();
	});

	it("deletes an item", async () => {
		const server = fakeListServer({ items: ["Milk", "Eggs"] });
		const { user } = renderList(server);

		await user.click(
			await screen.findByRole("button", { name: "Delete “Milk”" }),
		);

		expect(screen.queryByRole("checkbox", { name: "Milk" })).toBeNull();
		await vi.waitFor(() => expect(server.labels()).toEqual(["Eggs"]));
	});

	it("renames the list", async () => {
		const { user } = renderList(fakeListServer());

		await user.click(
			await screen.findByRole("button", { name: "Rename the list" }),
		);
		const field = screen.getByLabelText("List name");
		await user.clear(field);
		await user.type(field, "Weekend{Enter}");

		expect(
			await screen.findByRole("heading", { level: 1, name: "Weekend" }),
		).toBeVisible();
	});

	it("deletes the list after a confirmation, then goes back to the lists", async () => {
		const { user, requests, router } = renderList(fakeListServer());

		await user.click(
			await screen.findByRole("button", { name: "Delete the list" }),
		);
		const dialog = screen.getByRole("alertdialog", {
			name: "Delete “Groceries”?",
		});
		await user.click(within(dialog).getByRole("button", { name: "Delete" }));

		await vi.waitFor(() =>
			expect(router.state.location.pathname).toBe("/lists"),
		);
		expect(requests).toContainEqual({
			method: "DELETE",
			path: `/lists/${listId}`,
			body: undefined,
		});
	});

	it("shows a read-only list to a viewer", async () => {
		renderList(fakeListServer({ role: "viewer", items: ["Milk"] }));

		expect(await screen.findByText("Read only")).toBeVisible();
		expect(screen.getByRole("checkbox", { name: "Milk" })).toBeDisabled();
		expect(screen.queryByLabelText("New item")).toBeNull();
		expect(screen.queryByRole("button", { name: /Rename|Delete/ })).toBeNull();
	});

	it("only lets the owner delete the list", async () => {
		renderList(fakeListServer({ role: "editor" }));

		expect(
			await screen.findByRole("button", { name: "Rename the list" }),
		).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "Delete the list" }),
		).toBeNull();
	});
});
