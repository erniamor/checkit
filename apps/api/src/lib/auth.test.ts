import {
	captureEmails,
	cookieHeader,
	extractCode,
	jsonHeaders,
	WEB_ORIGIN,
} from "@test/helpers/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "@/app";

afterEach(() => {
	vi.restoreAllMocks();
});

function requestCode(email: string, headers: Record<string, string> = {}) {
	return app.request("/v1/auth/email-otp/send-verification-otp", {
		method: "POST",
		headers: { ...jsonHeaders, ...headers },
		body: JSON.stringify({ email, type: "sign-in" }),
	});
}

function signInWithCode(email: string, otp: string) {
	return app.request("/v1/auth/sign-in/email-otp", {
		method: "POST",
		headers: jsonHeaders,
		body: JSON.stringify({ email, otp }),
	});
}

function getProfile(cookie: string) {
	return app.request("/v1/me", { headers: { Cookie: cookie } });
}

describe("sign-in with an email code", () => {
	it("sends a code in French by default and signs the user in", async () => {
		const emails = captureEmails();

		expect((await requestCode("alice@example.com")).status).toBe(200);
		expect(emails).toHaveLength(1);
		expect(emails[0]?.to).toBe("alice@example.com");
		expect(emails[0]?.subject).toMatch(/^Votre code de connexion à Checkit/);

		const response = await signInWithCode(
			"alice@example.com",
			extractCode(emails[0]),
		);
		expect(response.status).toBe(200);

		const profile = await getProfile(cookieHeader(response));
		expect(profile.status).toBe(200);
		expect(await profile.json()).toMatchObject({ email: "alice@example.com" });
	});

	it("sends the email in English when the browser prefers it", async () => {
		const emails = captureEmails();

		await requestCode("bob@example.com", { "Accept-Language": "en-US,en" });

		expect(emails[0]?.subject).toMatch(/^Your Checkit sign-in code/);
	});

	it("rejects a wrong code", async () => {
		const emails = captureEmails();
		await requestCode("carol@example.com");
		const wrongCode = extractCode(emails[0]) === "000000" ? "111111" : "000000";

		const response = await signInWithCode("carol@example.com", wrongCode);

		expect(response.ok).toBe(false);
		expect(response.headers.getSetCookie()).toEqual([]);
	});
});

describe("sign-in with a magic link", () => {
	it("emails a link that opens a session and redirects to the app", async () => {
		const emails = captureEmails();

		const response = await app.request("/v1/auth/sign-in/magic-link", {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify({
				email: "dave@example.com",
				callbackURL: `${WEB_ORIGIN}/lists`,
			}),
		});
		expect(response.status).toBe(200);
		expect(emails[0]?.subject).toBe("Votre lien de connexion à Checkit");

		const link = emails[0]?.text.match(/https?:\/\/\S+/)?.[0];
		expect(link).toMatch(
			/^http:\/\/localhost:3001\/v1\/auth\/magic-link\/verify/,
		);
		const url = new URL(link ?? "");

		const verified = await app.request(`${url.pathname}${url.search}`);
		expect(verified.status).toBe(302);
		expect(verified.headers.get("Location")).toBe(`${WEB_ORIGIN}/lists`);

		const profile = await getProfile(cookieHeader(verified));
		expect(await profile.json()).toMatchObject({ email: "dave@example.com" });
	});

	it("refuses a callback URL outside the trusted origins", async () => {
		const emails = captureEmails();

		const response = await app.request("/v1/auth/sign-in/magic-link", {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify({
				email: "eve@example.com",
				callbackURL: "https://evil.example.com/steal",
			}),
		});

		expect(response.status).toBe(403);
		expect(emails).toHaveLength(0);
	});
});

describe("password sign-in", () => {
	it("is disabled", async () => {
		const response = await app.request("/v1/auth/sign-up/email", {
			method: "POST",
			headers: jsonHeaders,
			body: JSON.stringify({
				email: "frank@example.com",
				password: "a-long-password-123",
				name: "Frank",
			}),
		});

		expect(response.ok).toBe(false);
	});
});
