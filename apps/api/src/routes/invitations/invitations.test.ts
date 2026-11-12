import type {
	Invitation,
	InvitationPreview,
	List,
	Member,
	Paginated,
	ReceivedInvitation,
} from "@repo/schemas";
import { api, createList, joinList, json, setName } from "@test/helpers/api";
import { captureEmails, signIn } from "@test/helpers/auth";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/client";
import { invitations } from "@/db/schema";
import type { ErrorBody } from "@/lib/errors";
import type { EmailMessage } from "@/lib/mailer";
import { generateToken, hashToken } from "@/lib/tokens";
import { MAX_PENDING_INVITATIONS } from "@/routes/invitations/invitations.service";

let alice: string;
let bob: string;
let list: List;

beforeEach(async () => {
	alice = await signIn("alice@example.com");
	bob = await signIn("bob@example.com");
	list = await createList(alice, "Groceries");
});

afterEach(() => {
	vi.restoreAllMocks();
});

function invite(
	email: string,
	role = "editor",
	cookie = alice,
	headers?: Record<string, string>,
) {
	return api(`/v1/lists/${list.id}/invitations`, {
		method: "POST",
		cookie,
		body: { email, role },
		headers,
	});
}

function tokenFrom(email: EmailMessage | undefined): string {
	const token = email?.text.match(/\/invitations\/([\w-]+)/)?.[1];
	if (!token) {
		throw new Error("No invitation link found in the email");
	}
	return token;
}

/** Invites the email and returns the token of the link sent. */
async function inviteAndGetToken(email: string, role = "editor") {
	const emails = captureEmails();
	const response = await invite(email, role);
	expect(response.status).toBe(201);
	return tokenFrom(emails.at(-1));
}

describe("POST /v1/lists/:listId/invitations", () => {
	it("emails a link to the front end, in the inviter's language", async () => {
		const emails = captureEmails();

		const response = await invite("Bob@Example.com", "viewer", alice, {
			"Accept-Language": "fr-FR",
		});

		expect(response.status).toBe(201);
		expect(await json<Invitation>(response)).toMatchObject({
			listId: list.id,
			email: "bob@example.com",
			role: "viewer",
		});
		expect(emails).toHaveLength(1);
		expect(emails[0]?.to).toBe("bob@example.com");
		expect(emails[0]?.subject).toBe(
			"alice@example.com vous invite à la liste « Groceries » sur Checkit",
		);
		expect(emails[0]?.text).toMatch(
			/http:\/\/localhost:3000\/invitations\/[\w-]{43}/,
		);
	});

	it("replaces the pending invitation when inviting the same email again", async () => {
		const first = await inviteAndGetToken("carol@example.com");
		await inviteAndGetToken("carol@example.com");

		const pending = await json<Paginated<Invitation>>(
			await api(`/v1/lists/${list.id}/invitations`, { cookie: alice }),
		);
		expect(pending.pagination.total).toBe(1);
		expect((await api(`/v1/invitations/${first}`)).status).toBe(404);
	});

	it("refuses to invite a member", async () => {
		await joinList(list.id, "dave@example.com", "viewer");

		const response = await invite("dave@example.com");

		expect(response.status).toBe(409);
		expect((await json<ErrorBody>(response)).error.code).toBe("already_member");
	});

	it("rejects an invalid email with an error code", async () => {
		const response = await invite("not-an-email");

		expect(response.status).toBe(422);
		expect((await json<ErrorBody>(response)).error.details).toEqual([
			{ field: "email", message: "email_invalid" },
		]);
	});

	it("is reserved to the owner", async () => {
		const editor = await joinList(list.id, "dave@example.com", "editor");

		expect((await invite("carol@example.com", "viewer", editor)).status).toBe(
			403,
		);
	});

	it("limits the number of pending invitations", async () => {
		await db.insert(invitations).values(
			Array.from({ length: MAX_PENDING_INVITATIONS }, (_, index) => ({
				listId: list.id,
				email: `guest${index}@example.com`,
				role: "viewer" as const,
				tokenHash: hashToken(generateToken()),
				expiresAt: new Date(Date.now() + 60_000),
			})),
		);

		const response = await invite("carol@example.com");

		expect(response.status).toBe(429);
		expect((await json<ErrorBody>(response)).error.code).toBe(
			"too_many_invitations",
		);
	});
});

describe("DELETE /v1/lists/:listId/invitations/:invitationId", () => {
	it("cancels the invitation, whose link stops working", async () => {
		const token = await inviteAndGetToken("bob@example.com");
		const [pending] = (
			await json<Paginated<Invitation>>(
				await api(`/v1/lists/${list.id}/invitations`, { cookie: alice }),
			)
		).data;

		const response = await api(
			`/v1/lists/${list.id}/invitations/${pending?.id}`,
			{ method: "DELETE", cookie: alice },
		);

		expect(response.status).toBe(204);
		expect((await api(`/v1/invitations/${token}`)).status).toBe(404);
	});
});

describe("GET /v1/invitations/:token", () => {
	it("shows the invitation without a session", async () => {
		await setName("alice@example.com", "Alice");
		const token = await inviteAndGetToken("bob@example.com", "viewer");

		const response = await api(`/v1/invitations/${token}`);

		expect(response.status).toBe(200);
		expect(await json<InvitationPreview>(response)).toEqual({
			listId: list.id,
			listName: "Groceries",
			role: "viewer",
			email: "bob@example.com",
			invitedBy: "Alice",
			expiresAt: expect.any(String),
		});
	});

	it("never exposes the inviter's email, even when they have no name", async () => {
		const token = await inviteAndGetToken("bob@example.com");

		const preview = await json<InvitationPreview>(
			await api(`/v1/invitations/${token}`),
		);

		expect(preview.invitedBy).toBeNull();
		expect(JSON.stringify(preview)).not.toContain("alice@example.com");
	});

	it("answers 404 to an unknown token", async () => {
		const response = await api(`/v1/invitations/${generateToken()}`);

		expect(response.status).toBe(404);
		expect((await json<ErrorBody>(response)).error.code).toBe(
			"invitation_not_found",
		);
	});
});

describe("POST /v1/invitations/:token/accept", () => {
	it("makes the invited user a member with the invited role", async () => {
		const token = await inviteAndGetToken("bob@example.com", "editor");

		const response = await api(`/v1/invitations/${token}/accept`, {
			method: "POST",
			cookie: bob,
		});

		expect(response.status).toBe(200);
		expect(await json<List>(response)).toMatchObject({
			id: list.id,
			role: "editor",
		});
		const members = await json<Paginated<Member>>(
			await api(`/v1/lists/${list.id}/members`, { cookie: bob }),
		);
		expect(members.data.map((member) => member.email)).toContain(
			"bob@example.com",
		);
	});

	it("can be opened again by the same user, but no longer previewed", async () => {
		const token = await inviteAndGetToken("bob@example.com");
		const accept = () =>
			api(`/v1/invitations/${token}/accept`, { method: "POST", cookie: bob });
		await accept();

		expect((await accept()).status).toBe(200);
		expect((await api(`/v1/invitations/${token}`)).status).toBe(410);
	});

	it("refuses a user signed in with another email", async () => {
		const token = await inviteAndGetToken("bob@example.com");
		const carol = await signIn("carol@example.com");

		const response = await api(`/v1/invitations/${token}/accept`, {
			method: "POST",
			cookie: carol,
		});

		expect(response.status).toBe(403);
		expect((await json<ErrorBody>(response)).error.code).toBe(
			"invitation_email_mismatch",
		);
		expect((await api(`/v1/lists/${list.id}`, { cookie: carol })).status).toBe(
			404,
		);
	});

	it("refuses an expired invitation", async () => {
		const token = await inviteAndGetToken("bob@example.com");
		await db
			.update(invitations)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(invitations.tokenHash, hashToken(token)));

		const response = await api(`/v1/invitations/${token}/accept`, {
			method: "POST",
			cookie: bob,
		});

		expect(response.status).toBe(410);
		expect((await json<ErrorBody>(response)).error.code).toBe(
			"invitation_expired",
		);
	});

	it("requires a session", async () => {
		const token = await inviteAndGetToken("bob@example.com");

		const response = await api(`/v1/invitations/${token}/accept`, {
			method: "POST",
		});

		expect(response.status).toBe(401);
	});
});

describe("GET /v1/me/invitations", () => {
	it("lists the pending invitations sent to the user's email", async () => {
		await setName("alice@example.com", "Alice");
		await inviteAndGetToken("bob@example.com", "viewer");
		await inviteAndGetToken("carol@example.com");

		const response = await api("/v1/me/invitations", { cookie: bob });

		expect(response.status).toBe(200);
		const body = await json<Paginated<ReceivedInvitation>>(response);
		expect(body.data).toEqual([
			{
				id: expect.any(String),
				listId: list.id,
				listName: "Groceries",
				role: "viewer",
				invitedBy: "Alice",
				expiresAt: expect.any(String),
				createdAt: expect.any(String),
			},
		]);
		expect(body.pagination.total).toBe(1);
	});

	it("leaves out the accepted and expired invitations", async () => {
		const token = await inviteAndGetToken("bob@example.com");
		await api(`/v1/invitations/${token}/accept`, {
			method: "POST",
			cookie: bob,
		});
		const other = await createList(alice, "Hardware");
		await api(`/v1/lists/${other.id}/invitations`, {
			method: "POST",
			cookie: alice,
			body: { email: "bob@example.com", role: "editor" },
		});
		await db
			.update(invitations)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(invitations.listId, other.id));

		const body = await json<Paginated<ReceivedInvitation>>(
			await api("/v1/me/invitations", { cookie: bob }),
		);

		expect(body.data).toEqual([]);
	});

	it("requires a session", async () => {
		expect((await api("/v1/me/invitations")).status).toBe(401);
	});
});

describe("answering an invitation from the app", () => {
	async function receivedId(cookie = bob): Promise<string> {
		const body = await json<Paginated<ReceivedInvitation>>(
			await api("/v1/me/invitations", { cookie }),
		);
		return body.data[0]?.id ?? "";
	}

	it("accepts it, making the user a member, and its link then opens the list", async () => {
		const token = await inviteAndGetToken("bob@example.com", "viewer");

		const response = await api(
			`/v1/me/invitations/${await receivedId()}/accept`,
			{
				method: "POST",
				cookie: bob,
			},
		);

		expect(response.status).toBe(200);
		expect(await json<List>(response)).toMatchObject({
			id: list.id,
			role: "viewer",
		});
		expect(await receivedId()).toBe("");
		expect(
			(
				await api(`/v1/invitations/${token}/accept`, {
					method: "POST",
					cookie: bob,
				})
			).status,
		).toBe(200);
	});

	it("declines it: it's deleted, and its link no longer works", async () => {
		const token = await inviteAndGetToken("bob@example.com");
		const id = await receivedId();

		const response = await api(`/v1/me/invitations/${id}`, {
			method: "DELETE",
			cookie: bob,
		});

		expect(response.status).toBe(204);
		expect(await receivedId()).toBe("");
		expect((await api(`/v1/lists/${list.id}`, { cookie: bob })).status).toBe(
			404,
		);
		expect((await api(`/v1/invitations/${token}`)).status).toBe(404);
		const pending = await json<Paginated<Invitation>>(
			await api(`/v1/lists/${list.id}/invitations`, { cookie: alice }),
		);
		expect(pending.data).toEqual([]);
	});

	it("answers 404 for an invitation sent to someone else", async () => {
		await inviteAndGetToken("bob@example.com");
		const id = await receivedId();
		const carol = await signIn("carol@example.com");

		for (const [method, path] of [
			["POST", `/v1/me/invitations/${id}/accept`],
			["DELETE", `/v1/me/invitations/${id}`],
		] as const) {
			const response = await api(path, { method, cookie: carol });
			expect(response.status, `${method} ${path}`).toBe(404);
		}
		expect(await receivedId()).toBe(id);
	});

	it("refuses an expired invitation", async () => {
		await inviteAndGetToken("bob@example.com");
		const id = await receivedId();
		await db
			.update(invitations)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(eq(invitations.id, id));

		const response = await api(`/v1/me/invitations/${id}/accept`, {
			method: "POST",
			cookie: bob,
		});

		expect(response.status).toBe(410);
	});

	it("rejects an invalid id, and requires a session", async () => {
		expect(
			(
				await api("/v1/me/invitations/not-a-uuid/accept", {
					method: "POST",
					cookie: bob,
				})
			).status,
		).toBe(422);
		expect(
			(
				await api(`/v1/me/invitations/${generateToken()}`, {
					method: "DELETE",
				})
			).status,
		).toBe(401);
	});
});
