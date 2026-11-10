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
