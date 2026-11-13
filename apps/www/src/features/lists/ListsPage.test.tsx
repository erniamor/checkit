import type { List } from "@repo/schemas";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListsPage } from "@/features/lists/ListsPage";
import { setTestLocale } from "@/test/locale";
import { mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

function list(overrides: Partial<List>): List {
	return {
		id: "0b7e3f4a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
		name: "Groceries",
		kind: "purchases",
		role: "owner",
		itemCount: 0,
		doneCount: 0,
		createdAt: "2026-11-10T08:00:00.000Z",
		updatedAt: "2026-11-10T08:00:00.000Z",
		...overrides,
	};
}

function serve(lists: List[]) {
	return mockApi(({ method, path, body }) => {
		if (method === "GET" && path === "/lists") {
			return {
				status: 200,
				body: {
					data: lists,
					pagination: { page: 1, pageSize: 100, total: lists.length },
				},
			};
		}
		if (method === "POST" && path === "/lists") {
			return {
				status: 201,
				body: list({
					id: "7c6d5e4f-3a2b-4c1d-9e8f-7a6b5c4d3e2f",
					name: (body as { name: string }).name,
				}),
			};
		}
		return undefined;
	});
}

describe("ListsPage", () => {
	it("shows each list with its progress, and the ones shared with the user", async () => {
		setTestLocale("fr");
		serve([
			list({ name: "Groceries", itemCount: 5, doneCount: 3 }),
			list({
				id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
				name: "Chores",
				role: "editor",
			}),
		]);

		renderWithRouter(<ListsPage />);

		const groceries = await screen.findByRole("link", { name: /Groceries/ });
		expect(groceries).toHaveTextContent("3 sur 5 cochés");
		expect(groceries).not.toHaveTextContent("Partagée avec vous");
		expect(screen.getByRole("link", { name: /Chores/ })).toHaveTextContent(
			"Partagée avec vous",
		);
	});

	it("invites the user to create a first list", async () => {
		serve([]);

		renderWithRouter(<ListsPage />);

		expect(
			await screen.findByText(
				"You don't have any lists yet. Create your first one.",
			),
		).toBeVisible();
	});

	it("links to the page that creates a list", async () => {
		serve([]);
		renderWithRouter(<ListsPage />);

		expect(
			await screen.findByRole("link", { name: "New list" }),
		).toHaveAttribute("href", "/lists/new");
	});

	it("shows each list's kind", async () => {
		serve([
			list({ name: "Groceries" }),
			list({
				id: "7c6d5e4f-3a2b-4c1d-9e8f-7a6b5c4d3e2f",
				name: "Home",
				kind: "tasks",
			}),
		]);
		renderWithRouter(<ListsPage />);

		expect(
			await screen.findByRole("link", {
				name: "Purchases Groceries 0 of 0 checked",
			}),
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Tasks Home 0 of 0 checked" }),
		).toBeVisible();
	});
});
