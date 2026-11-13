import type { ReceivedInvitation } from "@repo/schemas";
import { Toaster } from "@repo/ui";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InvitationsMenu } from "@/features/sharing/InvitationsMenu";
import { type ApiResponse, aliceProfile, mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

const date = "2026-11-10T08:00:00.000Z";
const groceries = {
	id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
	listId: "0b7e3f4a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
	listName: "Groceries",
	role: "editor",
	invitedBy: "Bob",
	expiresAt: date,
	createdAt: date,
} satisfies ReceivedInvitation;
const hardware = {
	...groceries,
	id: "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
	listId: "7c6d5e4f-3a2b-4c1d-9e8f-7a6b5c4d3e2f",
	listName: "Hardware",
	role: "viewer",
	invitedBy: null,
} satisfies ReceivedInvitation;

/** An in-memory API for the invitations received; `answer` overrides the answers. */
function serveInvitations(
	initial: ReceivedInvitation[],
	answer?: () => ApiResponse,
) {
	let received = initial;
	return mockApi(({ method, path }) => {
		if (method === "GET" && path === "/me/invitations") {
			return {
				status: 200,
				body: {
					data: received,
					pagination: { page: 1, pageSize: 50, total: received.length },
				},
			};
		}
		const answered = path.match(/^\/me\/invitations\/([^/]+)/)?.[1];
		const invitation = received.find((other) => other.id === answered);
		if (!invitation) {
			return undefined;
		}
		if (answer) {
			return answer();
		}
		received = received.filter((other) => other !== invitation);
		if (method === "DELETE") {
			return { status: 204 };
		}
		return {
			status: 200,
			body: {
				id: invitation.listId,
				name: invitation.listName,
				kind: "purchases",
				role: invitation.role,
				itemCount: 0,
				doneCount: 0,
				createdAt: date,
				updatedAt: date,
			},
		};
	});
}

async function openMenu() {
	const user = userEvent.setup();
	renderWithRouter(
		<>
			<InvitationsMenu userId={aliceProfile.id} />
			<Toaster />
		</>,
	);
	return user;
}

describe("InvitationsMenu", () => {
	it("shows how many invitations are waiting, and lists them", async () => {
		serveInvitations([groceries, hardware]);
		const user = await openMenu();

		const bell = await screen.findByRole("button", {
			name: "Invitations, 2 pending",
		});
		await user.click(bell);

		const panel = await screen.findByRole("dialog", { name: "Invitations" });
		expect(
			within(panel).getByText("Bob invites you to join “Groceries”."),
		).toBeVisible();
		expect(within(panel).getByText("Can edit")).toBeVisible();
		expect(
			within(panel).getByText("You're invited to join “Hardware”."),
		).toBeVisible();
	});

	it("accepts an invitation, then offers to open the list", async () => {
		const requests = serveInvitations([groceries]);
		const user = await openMenu();
		await user.click(
			await screen.findByRole("button", { name: "Invitations, 1 pending" }),
		);

		await user.click(
			await screen.findByRole("button", {
				name: "Accept the invitation to “Groceries”",
			}),
		);

		expect(await screen.findByText("You joined “Groceries”.")).toBeVisible();
		expect(screen.getByRole("button", { name: "Open" })).toBeVisible();
		expect(requests).toContainEqual({
			method: "POST",
			path: `/me/invitations/${groceries.id}/accept`,
			body: undefined,
		});
		expect(
			await screen.findByText("No pending invitations."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Invitations" }),
		).toBeInTheDocument();
	});

	it("declines an invitation", async () => {
		const requests = serveInvitations([groceries, hardware]);
		const user = await openMenu();
		await user.click(
			await screen.findByRole("button", { name: "Invitations, 2 pending" }),
		);

		await user.click(
			await screen.findByRole("button", {
				name: "Decline the invitation to “Hardware”",
			}),
		);

		expect(
			await screen.findByText("Invitation to “Hardware” declined."),
		).toBeVisible();
		expect(requests).toContainEqual({
			method: "DELETE",
			path: `/me/invitations/${hardware.id}`,
			body: undefined,
		});
		expect(
			await screen.findByRole("button", { name: "Invitations, 1 pending" }),
		).toBeInTheDocument();
	});

	it("says when an invitation is no longer valid", async () => {
		serveInvitations([groceries], () => ({
			status: 410,
			body: { error: { code: "invitation_expired", message: "" } },
		}));
		const user = await openMenu();
		await user.click(
			await screen.findByRole("button", { name: "Invitations, 1 pending" }),
		);

		await user.click(
			await screen.findByRole("button", {
				name: "Accept the invitation to “Groceries”",
			}),
		);

		expect(
			await screen.findByText("This invitation is no longer valid"),
		).toBeVisible();
	});

	it("says when there is no invitation", async () => {
		serveInvitations([]);
		const user = await openMenu();

		await user.click(
			await screen.findByRole("button", { name: "Invitations" }),
		);

		expect(await screen.findByText("No pending invitations.")).toBeVisible();
	});
});
