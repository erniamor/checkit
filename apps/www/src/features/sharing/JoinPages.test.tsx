import type { InvitationPreview, Profile } from "@repo/schemas";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InvitationPage } from "@/features/sharing/InvitationPage";
import { ShareLinkPage } from "@/features/sharing/ShareLinkPage";
import { setTestLocale } from "@/test/locale";
import { mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

const listId = "0b7e3f4a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const date = "2026-11-10T08:00:00.000Z";
const list = {
	id: listId,
	name: "Groceries",
	kind: "purchases",
	role: "editor",
	itemCount: 0,
	doneCount: 0,
	createdAt: date,
	updatedAt: date,
};
const invitation: InvitationPreview = {
	listId,
	listName: "Groceries",
	role: "editor",
	email: "bob@example.com",
	invitedBy: "Alice",
	expiresAt: date,
};

function profile(email: string): Profile {
	return {
		id: "8e7d6c5b-4a3f-4e2d-9c1b-0a9f8e7d6c5b",
		email,
		name: "Bob",
		image: null,
	};
}

function expired() {
	return {
		status: 410,
		body: { error: { code: "invitation_expired", message: "Expired" } },
	};
}

describe("InvitationPage", () => {
	it("shows the invitation, and sends a visitor to sign in with the invited email", async () => {
		setTestLocale("fr");
		renderWithRouter(
			<InvitationPage token="tok" preview={invitation} me={null} />,
		);

		expect(
			await screen.findByRole("heading", { name: "Rejoindre « Groceries »" }),
		).toBeVisible();
		expect(
			screen.getByText("Alice vous invite à rejoindre cette liste."),
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Se connecter pour rejoindre" }),
		).toHaveAttribute(
			"href",
			"/sign-in?redirect=%2Finvitations%2Ftok&email=bob%40example.com",
		);
	});

	it("joins the list with the invited account, then opens it", async () => {
		const requests = mockApi(() => ({ status: 200, body: list }));
		const user = userEvent.setup();
		const { router } = renderWithRouter(
			<InvitationPage
				token="tok"
				preview={invitation}
				me={profile("Bob@Example.com")}
			/>,
		);

		await user.click(
			await screen.findByRole("button", { name: "Join the list" }),
		);

		await vi.waitFor(() =>
			expect(router.state.location.pathname).toBe(`/lists/${listId}`),
		);
		expect(requests).toEqual([
			{ method: "POST", path: "/invitations/tok/accept", body: undefined },
		]);
	});

	it("explains that another account is signed in, and offers to sign out", async () => {
		const requests = mockApi(() => ({ status: 200, body: { success: true } }));
		const user = userEvent.setup();
		renderWithRouter(
			<InvitationPage
				token="tok"
				preview={invitation}
				me={profile("carol@example.com")}
			/>,
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"This invitation was sent to bob@example.com, but you're signed in as carol@example.com.",
		);
		expect(screen.queryByRole("button", { name: "Join the list" })).toBeNull();
		await user.click(
			screen.getByRole("button", { name: "Sign out to use that address" }),
		);
		await vi.waitFor(() =>
			expect(requests).toContainEqual(
				expect.objectContaining({ path: "/auth/sign-out" }),
			),
		);
	});

	it("says when the invitation expired meanwhile", async () => {
		mockApi(expired);
		const user = userEvent.setup();
		renderWithRouter(
			<InvitationPage
				token="tok"
				preview={invitation}
				me={profile("bob@example.com")}
			/>,
		);

		await user.click(
			await screen.findByRole("button", { name: "Join the list" }),
		);

		expect(
			await screen.findByRole("heading", {
				name: "This invitation is no longer valid",
			}),
		).toBeVisible();
	});
});

describe("ShareLinkPage", () => {
	const preview = {
		listId,
		listName: "Groceries",
		role: "viewer" as const,
		owner: "Alice",
	};

	it("sends a visitor to sign in, then back to the link", async () => {
		renderWithRouter(<ShareLinkPage token="tok" preview={preview} me={null} />);

		expect(await screen.findByText("Shared by Alice.")).toBeVisible();
		expect(screen.getByText("You'll be able to see the list.")).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Sign in to join" }),
		).toHaveAttribute("href", "/sign-in?redirect=%2Fjoin%2Ftok");
	});

	it("joins the list, then opens it", async () => {
		const requests = mockApi(() => ({ status: 200, body: list }));
		const user = userEvent.setup();
		const { router } = renderWithRouter(
			<ShareLinkPage
				token="tok"
				preview={preview}
				me={profile("bob@example.com")}
			/>,
		);

		await user.click(
			await screen.findByRole("button", { name: "Join the list" }),
		);

		await vi.waitFor(() =>
			expect(router.state.location.pathname).toBe(`/lists/${listId}`),
		);
		expect(requests).toEqual([
			{ method: "POST", path: "/share-links/tok/join", body: undefined },
		]);
	});

	it("says when the link was revoked meanwhile", async () => {
		mockApi(expired);
		const user = userEvent.setup();
		renderWithRouter(
			<ShareLinkPage
				token="tok"
				preview={{ ...preview, owner: null }}
				me={profile("bob@example.com")}
			/>,
		);
		expect(screen.queryByText(/Shared by/)).toBeNull();

		await user.click(
			await screen.findByRole("button", { name: "Join the list" }),
		);

		expect(
			await screen.findByRole("heading", { name: "This link no longer works" }),
		).toBeVisible();
	});
});
