import { describe, expect, it } from "vitest";
import { ApiError, ValidationError } from "./errors";
import { fakeApi } from "./test/fake-fetch";
import { list, listId, paginated } from "./test/fixtures";

const userId = "5f1b7c2e-8d4a-4e6b-9c3f-1a2b3c4d5e6f";
const date = "2026-11-10T08:00:00.000Z";
const listUrl = `http://api.test/v1/lists/${listId}`;

const member = {
	userId,
	name: "Bob",
	email: "bob@example.com",
	image: null,
	role: "editor",
	joinedAt: date,
};

const invitation = {
	id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
	listId,
	email: "bob@example.com",
	role: "viewer",
	invitedById: userId,
	expiresAt: date,
	createdAt: date,
};

const shareLink = {
	id: "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
	listId,
	role: "editor",
	token: "abc_DEF-123",
	createdAt: date,
};

function calls(requests: { method: string; url: string; body: unknown }[]) {
	return requests.map(({ method, url, body }) => ({ method, url, body }));
}

describe("members", () => {
	it("lists the members, without the API's envelope", async () => {
		const { api, requests } = fakeApi(200, paginated([member]));

		expect((await api.members.list(listId)).items).toEqual([member]);
		expect(requests[0]?.url).toBe(`${listUrl}/members`);
	});

	it("changes a role, removes a member and leaves the list", async () => {
		const { api, requests } = fakeApi(200, member);

		await api.members.updateRole(listId, userId, { role: "viewer" });
		await api.members.remove(listId, userId);
		await api.members.leave(listId);

		expect(calls(requests)).toEqual([
			{
				method: "PATCH",
				url: `${listUrl}/members/${userId}`,
				body: { role: "viewer" },
			},
			{
				method: "DELETE",
				url: `${listUrl}/members/${userId}`,
				body: undefined,
			},
			{ method: "DELETE", url: `${listUrl}/members/me`, body: undefined },
		]);
	});

	it("refuses to grant ownership before sending", async () => {
		const { api, fetch } = fakeApi(200, member);

		await expect(
			api.members.updateRole(listId, userId, { role: "owner" as "editor" }),
		).rejects.toBeInstanceOf(ValidationError);
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe("invitations", () => {
	it("lists, creates and revokes invitations", async () => {
		const { api, requests } = fakeApi(200, invitation);

		await api.invitations.create(listId, {
			email: " Bob@Example.com",
			role: "viewer",
		});
		await api.invitations.revoke(listId, invitation.id);

		expect(calls(requests)).toEqual([
			{
				method: "POST",
				url: `${listUrl}/invitations`,
				body: { email: "bob@example.com", role: "viewer" },
			},
			{
				method: "DELETE",
				url: `${listUrl}/invitations/${invitation.id}`,
				body: undefined,
			},
		]);
	});

	it("previews and accepts an invitation by its token", async () => {
		const preview = {
			listId,
			listName: "Groceries",
			role: "viewer",
			email: "bob@example.com",
			invitedBy: "Alice",
			expiresAt: date,
		};
		const previewApi = fakeApi(200, preview);
		expect(await previewApi.api.invitations.preview("tok")).toEqual(preview);
		expect(previewApi.requests[0]?.url).toBe(
			"http://api.test/v1/invitations/tok",
		);

		const acceptApi = fakeApi(200, list);
		expect(await acceptApi.api.invitations.accept("tok")).toEqual(list);
		expect(acceptApi.requests[0]).toMatchObject({
			method: "POST",
			url: "http://api.test/v1/invitations/tok/accept",
		});
	});

	it("reports an expired invitation as a 410", async () => {
		const { api } = fakeApi(410, {
			error: { code: "invitation_expired", message: "Expired" },
		});

		const error = await api.invitations.preview("tok").catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 410, code: "invitation_expired" });
	});
});

describe("shareLinks", () => {
	it("lists, creates and revokes links", async () => {
		const { api, requests } = fakeApi(200, shareLink);

		expect(await api.shareLinks.create(listId, { role: "editor" })).toEqual(
			shareLink,
		);
		await api.shareLinks.revoke(listId, shareLink.id);

		expect(calls(requests)).toEqual([
			{
				method: "POST",
				url: `${listUrl}/share-links`,
				body: { role: "editor" },
			},
			{
				method: "DELETE",
				url: `${listUrl}/share-links/${shareLink.id}`,
				body: undefined,
			},
		]);
	});

	it("previews and joins through a link's token", async () => {
		const preview = {
			listId,
			listName: "Groceries",
			role: "editor",
			owner: null,
		};
		const previewApi = fakeApi(200, preview);
		expect(await previewApi.api.shareLinks.preview("tok")).toEqual(preview);

		const joinApi = fakeApi(200, list);
		expect(await joinApi.api.shareLinks.join("tok")).toEqual(list);
		expect(joinApi.requests[0]).toMatchObject({
			method: "POST",
			url: "http://api.test/v1/share-links/tok/join",
		});
	});
});
