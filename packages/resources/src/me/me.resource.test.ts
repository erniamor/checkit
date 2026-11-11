import { describe, expect, it } from "vitest";
import { UnauthorizedError, ValidationError } from "../errors";
import { fakeApi } from "../test/fake-fetch";

const profile = {
	id: "5f1b7c2e-8d4a-4e6b-9c3f-1a2b3c4d5e6f",
	email: "alice@example.com",
	name: "Alice",
	image: null,
};

describe("me", () => {
	it("gets the signed-in user's profile", async () => {
		const { api, requests } = fakeApi(200, profile);

		expect(await api.me.get()).toEqual(profile);
		expect(requests[0]).toMatchObject({
			url: "http://api.test/v1/me",
			method: "GET",
		});
	});

	it("throws an UnauthorizedError without a session", async () => {
		const { api } = fakeApi(401, {
			error: { code: "unauthorized", message: "Sign-in required" },
		});

		await expect(api.me.get()).rejects.toBeInstanceOf(UnauthorizedError);
	});

	it("updates the name", async () => {
		const { api, requests } = fakeApi(200, profile);

		expect(await api.me.update({ name: " Alice " })).toEqual(profile);
		expect(requests[0]).toMatchObject({
			method: "PATCH",
			body: { name: "Alice" },
		});
	});

	it("rejects a blank name before sending", async () => {
		const { api, fetch } = fakeApi(200, profile);

		await expect(api.me.update({ name: " " })).rejects.toBeInstanceOf(
			ValidationError,
		);
		expect(fetch).not.toHaveBeenCalled();
	});
});
