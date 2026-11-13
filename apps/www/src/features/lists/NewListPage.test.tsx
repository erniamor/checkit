import type { List } from "@repo/schemas";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewListPage } from "@/features/lists/NewListPage";
import { mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

const createdId = "7c6d5e4f-3a2b-4c1d-9e8f-7a6b5c4d3e2f";

/** An API that creates the lists it's sent. */
function serve() {
	return mockApi(({ method, path, body }) => {
		if (method === "POST" && path === "/lists") {
			const input = body as Pick<List, "name" | "kind">;
			const list: List = {
				id: createdId,
				name: input.name,
				kind: input.kind ?? "purchases",
				role: "owner",
				itemCount: 0,
				doneCount: 0,
				createdAt: "2026-11-13T08:00:00.000Z",
				updatedAt: "2026-11-13T08:00:00.000Z",
			};
			return { status: 201, body: list };
		}
		if (method === "GET" && path === "/lists") {
			return {
				status: 200,
				body: { data: [], pagination: { page: 1, pageSize: 100, total: 0 } },
			};
		}
		return undefined;
	});
}

describe("NewListPage", () => {
	it("creates a list and opens it in place of the form", async () => {
		const requests = serve();
		const user = userEvent.setup();
		const { router } = renderWithRouter(<NewListPage />);

		expect(
			await screen.findByRole("heading", { level: 1, name: "New list" }),
		).toBeVisible();
		await user.type(screen.getByLabelText("List name"), "Weekend");
		await user.click(screen.getByRole("button", { name: "Create" }));

		await vi.waitFor(() =>
			expect(router.state.location.pathname).toBe(`/lists/${createdId}`),
		);
		// Replaced: the back button doesn't come back to the form
		expect(router.history.length).toBe(1);
		expect(requests).toContainEqual({
			method: "POST",
			path: "/lists",
			body: { name: "Weekend", kind: "purchases" },
		});
	});

	it("creates a list of tasks", async () => {
		const requests = serve();
		const user = userEvent.setup();
		renderWithRouter(<NewListPage />);

		await user.type(await screen.findByLabelText("List name"), "Home");
		await user.click(screen.getByRole("radio", { name: "Tasks" }));
		await user.click(screen.getByRole("button", { name: "Create" }));

		await vi.waitFor(() =>
			expect(requests).toContainEqual({
				method: "POST",
				path: "/lists",
				body: { name: "Home", kind: "tasks" },
			}),
		);
	});

	it("shows an invalid name next to the field", async () => {
		const requests = serve();
		const user = userEvent.setup();
		renderWithRouter(<NewListPage />);

		await user.click(await screen.findByRole("button", { name: "Create" }));

		const field = screen.getByLabelText("List name");
		expect(field).toBeInvalid();
		expect(
			within(field.parentElement as HTMLElement).getByText(
				"Enter a name for the list.",
			),
		).toBeVisible();
		expect(requests.filter((request) => request.method === "POST")).toEqual([]);
	});

	it("goes back to the lists on cancel", async () => {
		serve();
		renderWithRouter(<NewListPage />);

		expect(await screen.findByRole("link", { name: "Cancel" })).toHaveAttribute(
			"href",
			"/lists",
		);
		expect(screen.getByRole("link", { name: "← All lists" })).toHaveAttribute(
			"href",
			"/lists",
		);
	});
});
