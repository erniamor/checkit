import type {
	List,
	Paginated,
	ShareLink,
	ShareLinkPreview,
} from "@repo/schemas";
import { api, createList, joinList, json, setName } from "@test/helpers/api";
import { signIn } from "@test/helpers/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ErrorBody } from "@/lib/errors";
import { generateToken } from "@/lib/tokens";

let alice: string;
let list: List;

beforeEach(async () => {
	alice = await signIn("alice@example.com");
	list = await createList(alice, "Groceries");
});

afterEach(() => {
	vi.restoreAllMocks();
});

async function createLink(role: string, cookie = alice) {
	return api(`/v1/lists/${list.id}/share-links`, {
		method: "POST",
		cookie,
		body: { role },
	});
}

async function linkToken(role: string): Promise<string> {
	return (await json<ShareLink>(await createLink(role))).token;
}

async function activeLinks(): Promise<ShareLink[]> {
	return (
		await json<Paginated<ShareLink>>(
			await api(`/v1/lists/${list.id}/share-links`, { cookie: alice }),
		)
	).data;
}

function join(token: string, cookie?: string) {
	return api(`/v1/share-links/${token}/join`, { method: "POST", cookie });
}

describe("POST /v1/lists/:listId/share-links", () => {
	it("creates a link for a role", async () => {
		const response = await createLink("viewer");

		expect(response.status).toBe(201);
		expect(await json<ShareLink>(response)).toEqual({
			id: expect.any(String),
			listId: list.id,
			role: "viewer",
			token: expect.stringMatching(/^[\w-]{43}$/),
			createdAt: expect.any(String),
		});
	});

	it("keeps a single active link per role", async () => {
		const first = await linkToken("viewer");
		const second = await linkToken("viewer");
		await linkToken("editor");

		const links = await activeLinks();
		expect(links.map((link) => link.role).sort()).toEqual(["editor", "viewer"]);
		expect(links.find((link) => link.role === "viewer")?.token).toBe(second);
		expect((await api(`/v1/share-links/${first}`)).status).toBe(410);
	});

	it("is reserved to the owner", async () => {
		const editor = await joinList(list.id, "bob@example.com", "editor");

		expect((await createLink("viewer", editor)).status).toBe(403);
	});

	it("can't create a link granting ownership", async () => {
		expect((await createLink("owner")).status).toBe(422);
	});
});

describe("GET /v1/share-links/:token", () => {
	it("shows the link without a session, with the owner's name", async () => {
		await setName("alice@example.com", "Alice");
		const token = await linkToken("editor");

		const response = await api(`/v1/share-links/${token}`);

		expect(response.status).toBe(200);
		expect(await json<ShareLinkPreview>(response)).toEqual({
			listId: list.id,
			listName: "Groceries",
			role: "editor",
			owner: "Alice",
		});
	});

	it("never exposes the owner's email, even when they have no name", async () => {
		const token = await linkToken("viewer");

		const preview = await json<ShareLinkPreview>(
			await api(`/v1/share-links/${token}`),
		);

		expect(preview.owner).toBeNull();
		expect(JSON.stringify(preview)).not.toContain("alice@example.com");
	});

	it("answers 404 to an unknown token", async () => {
		const response = await api(`/v1/share-links/${generateToken()}`);

		expect(response.status).toBe(404);
		expect((await json<ErrorBody>(response)).error.code).toBe(
			"share_link_not_found",
		);
	});
});

describe("POST /v1/share-links/:token/join", () => {
	it("makes the user a member with the link's role", async () => {
		const token = await linkToken("viewer");
		const bob = await signIn("bob@example.com");

		const response = await join(token, bob);

		expect(response.status).toBe(200);
		expect(await json<List>(response)).toMatchObject({
			id: list.id,
			role: "viewer",
		});
	});

	it("upgrades a viewer who opens an editor link", async () => {
		const bob = await joinList(list.id, "bob@example.com", "viewer");

		const response = await join(await linkToken("editor"), bob);

		expect((await json<List>(response)).role).toBe("editor");
	});

	it("never downgrades a member", async () => {
		const bob = await joinList(list.id, "bob@example.com", "editor");
		const viewerLink = await linkToken("viewer");

		expect((await json<List>(await join(viewerLink, bob))).role).toBe("editor");
		expect((await json<List>(await join(viewerLink, alice))).role).toBe(
			"owner",
		);
	});

	it("requires a session", async () => {
		expect((await join(await linkToken("viewer"))).status).toBe(401);
	});
});

describe("DELETE /v1/lists/:listId/share-links/:linkId", () => {
	it("revokes the link", async () => {
		const link = await json<ShareLink>(await createLink("viewer"));
		const path = `/v1/lists/${list.id}/share-links/${link.id}`;

		const response = await api(path, { method: "DELETE", cookie: alice });

		expect(response.status).toBe(204);
		expect(await activeLinks()).toEqual([]);
		const bob = await signIn("bob@example.com");
		const joined = await join(link.token, bob);
		expect(joined.status).toBe(410);
		expect((await json<ErrorBody>(joined)).error.code).toBe(
			"share_link_revoked",
		);
		expect((await api(path, { method: "DELETE", cookie: alice })).status).toBe(
			404,
		);
	});
});
