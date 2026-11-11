import { signIn } from "@test/helpers/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "@/app";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("GET /v1/me", () => {
	it("requires a session", async () => {
		const response = await app.request("/v1/me");

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error: { code: "unauthorized", message: "Sign-in required" },
		});
	});

	it("rejects an invalid session cookie", async () => {
		const response = await app.request("/v1/me", {
			headers: { Cookie: "better-auth.session_token=forged" },
		});

		expect(response.status).toBe(401);
	});

	it("returns the signed-in user's profile and nothing more", async () => {
		const cookie = await signIn("alice@example.com");

		const response = await app.request("/v1/me", {
			headers: { Cookie: cookie },
		});

		expect(response.status).toBe(200);
		const profile = await response.json();
		expect(profile).toEqual({
			id: expect.any(String),
			email: "alice@example.com",
			name: "",
			image: null,
		});
	});
});

describe("PATCH /v1/me", () => {
	function patchMe(body: unknown, cookie?: string) {
		return app.request("/v1/me", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				...(cookie ? { Cookie: cookie } : {}),
			},
			body: JSON.stringify(body),
		});
	}

	it("sets the user's name, kept for the next requests", async () => {
		const cookie = await signIn("alice@example.com");

		const response = await patchMe({ name: "  Alice " }, cookie);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ name: "Alice" });
		const profile = await app.request("/v1/me", {
			headers: { Cookie: cookie },
		});
		expect(await profile.json()).toMatchObject({ name: "Alice" });
	});

	it("rejects a blank name with an error code", async () => {
		const cookie = await signIn("alice@example.com");

		const response = await patchMe({ name: " " }, cookie);

		expect(response.status).toBe(422);
		expect(await response.json()).toMatchObject({
			error: { details: [{ field: "name", message: "name_required" }] },
		});
	});

	it("requires a session", async () => {
		expect((await patchMe({ name: "Alice" })).status).toBe(401);
	});
});
