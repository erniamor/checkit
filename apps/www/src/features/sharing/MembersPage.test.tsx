import { Toaster } from "@repo/ui";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MembersPage } from "@/features/sharing/MembersPage";
import { fakeListServer, listId, meId } from "@/test/fake-list-server";
import { mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

async function renderMembers(server: ReturnType<typeof fakeListServer>) {
	const requests = mockApi(server.respond);
	const user = userEvent.setup();
	const result = renderWithRouter(
		<>
			<MembersPage listId={listId} meId={meId} />
			<Toaster />
		</>,
	);
	await screen.findByRole("heading", { level: 1, name: "Members and sharing" });
	return { ...result, requests, user };
}

function section(name: string) {
	return screen.getByRole("region", { name });
}

describe("MembersPage, as the owner", () => {
	it("lists the members with their role", async () => {
		await renderMembers(fakeListServer());

		const members = within(section("Members")).getAllByRole("listitem");
		expect(members[0]).toHaveTextContent("Alice (you)");
		expect(members[0]).toHaveTextContent("Owner");
		expect(
			within(members[1] as HTMLElement).getByRole("combobox", {
				name: "Role of Bob",
			}),
		).toHaveValue("editor");
	});

	it("changes a member's role", async () => {
		const { user, requests } = await renderMembers(fakeListServer());

		await user.selectOptions(
			screen.getByRole("combobox", { name: "Role of Bob" }),
			"Can view",
		);

		await vi.waitFor(() =>
			expect(screen.getByRole("combobox", { name: "Role of Bob" })).toHaveValue(
				"viewer",
			),
		);
		expect(requests).toContainEqual(
			expect.objectContaining({ method: "PATCH", body: { role: "viewer" } }),
		);
	});

	it("removes a member after a confirmation", async () => {
		const server = fakeListServer();
		const { user } = await renderMembers(server);

		await user.click(screen.getByRole("button", { name: "Remove Bob" }));
		const dialog = screen.getByRole("alertdialog", {
			name: "Remove Bob from the list?",
		});
		await user.click(within(dialog).getByRole("button", { name: "Remove" }));

		await vi.waitFor(() =>
			expect(screen.queryByText("Bob")).not.toBeInTheDocument(),
		);
		expect(server.memberEmails()).toEqual(["alice@example.com"]);
	});

	it("invites someone by email", async () => {
		const server = fakeListServer();
		const { user } = await renderMembers(server);
		const invite = section("Invite by email");

		await user.type(
			within(invite).getByLabelText("Email address"),
			"Dave@Example.com",
		);
		await user.selectOptions(within(invite).getByLabelText("Role"), "Can view");
		await user.click(
			within(invite).getByRole("button", { name: "Send the invitation" }),
		);

		expect(
			await screen.findByText("Invitation sent to dave@example.com."),
		).toBeVisible();
		expect(
			await within(invite).findByText("dave@example.com"),
		).toBeInTheDocument();
		expect(within(invite).getByLabelText("Email address")).toHaveValue("");
	});

	it("explains why an invitation can't be sent", async () => {
		const { user, requests } = await renderMembers(fakeListServer());
		const invite = section("Invite by email");
		const email = within(invite).getByLabelText("Email address");
		const send = within(invite).getByRole("button", {
			name: "Send the invitation",
		});

		await user.type(email, "not-an-email");
		await user.click(send);
		expect(
			await within(invite).findByText("Enter a valid email address."),
		).toBeVisible();
		expect(requests.filter((request) => request.method === "POST")).toEqual([]);

		await user.clear(email);
		await user.type(email, "bob@example.com");
		await user.click(send);
		expect(await within(invite).findByRole("alert")).toHaveTextContent(
			"This person is already a member of the list.",
		);
	});

	it("cancels a pending invitation", async () => {
		const server = fakeListServer();
		const { user } = await renderMembers(server);
		const invite = section("Invite by email");
		await user.type(
			within(invite).getByLabelText("Email address"),
			"dave@example.com",
		);
		await user.click(
			within(invite).getByRole("button", { name: "Send the invitation" }),
		);

		await user.click(
			await screen.findByRole("button", {
				name: "Cancel the invitation to dave@example.com",
			}),
		);

		await vi.waitFor(() => expect(server.invitationEmails()).toEqual([]));
		await vi.waitFor(() =>
			expect(within(invite).queryByText("dave@example.com")).toBeNull(),
		);
	});

	it("creates, copies and revokes a share link", async () => {
		const server = fakeListServer();
		const { user } = await renderMembers(server);
		const links = section("Share links");

		const [editorCard] = within(links).getAllByRole("button", {
			name: "Create a link",
		});
		await user.click(editorCard as HTMLElement);

		const field = await within(links).findByLabelText("Link to edit the list");
		expect((field as HTMLInputElement).value).toMatch(
			/^http:\/\/localhost:3000\/join\/token-\d+$/,
		);

		await user.click(within(links).getByRole("button", { name: "Copy" }));
		expect(await screen.findByText("Link copied.")).toBeVisible();
		expect(await navigator.clipboard.readText()).toBe(
			(field as HTMLInputElement).value,
		);

		await user.click(within(links).getByRole("button", { name: "Revoke" }));
		await user.click(
			within(screen.getByRole("alertdialog")).getByRole("button", {
				name: "Revoke",
			}),
		);
		await vi.waitFor(() => expect(server.linkRoles()).toEqual([]));
		await vi.waitFor(() =>
			expect(
				within(links).getAllByRole("button", { name: "Create a link" }),
			).toHaveLength(2),
		);
	});
});

describe("MembersPage, as another member", () => {
	it("shows the members without managing them, nor the sharing", async () => {
		await renderMembers(fakeListServer({ role: "viewer" }));

		const members = within(section("Members")).getAllByRole("listitem");
		expect(members[0]).toHaveTextContent("Can view");
		expect(members[1]).toHaveTextContent("Carol");
		expect(members[1]).toHaveTextContent("Owner");
		expect(screen.queryByRole("combobox")).toBeNull();
		expect(
			screen.queryByRole("region", { name: "Invite by email" }),
		).toBeNull();
		expect(screen.queryByRole("region", { name: "Share links" })).toBeNull();
	});

	it("leaves the list after a confirmation", async () => {
		const { user, requests, router } = await renderMembers(
			fakeListServer({ role: "editor" }),
		);

		await user.click(screen.getByRole("button", { name: "Leave the list" }));
		await user.click(
			within(screen.getByRole("alertdialog")).getByRole("button", {
				name: "Leave",
			}),
		);

		expect(await screen.findByText("You left “Groceries”.")).toBeVisible();
		await vi.waitFor(() =>
			expect(router.state.location.pathname).toBe("/lists"),
		);
		expect(requests).toContainEqual({
			method: "DELETE",
			path: `/lists/${listId}/members/me`,
			body: undefined,
		});
	});
});
