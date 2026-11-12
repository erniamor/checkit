import {
	captureEmails,
	cookieHeader,
	extractCode,
	jsonHeaders,
	WEB_ORIGIN,
} from "@test/helpers/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "@/app";
import { crossSubDomainCookies } from "@/lib/auth";

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
	it("sends a code in English by default and signs the user in", async () => {
		const emails = captureEmails();

		expect((await requestCode("alice@example.com")).status).toBe(200);
		expect(emails).toHaveLength(1);
		expect(emails[0]?.to).toBe("alice@example.com");
		expect(emails[0]?.subject).toMatch(/^Your Checkit sign-in code/);

		const response = await signInWithCode(
			"alice@example.com",
			extractCode(emails[0]),
		);
		expect(response.status).toBe(200);

		const profile = await getProfile(cookieHeader(response));
		expect(profile.status).toBe(200);
		expect(await profile.json()).toMatchObject({ email: "alice@example.com" });
	});

	it.each([
		["French", "fr-FR,fr;q=0.9", /^Votre code de connexion à Checkit/],
		["Spanish", "es-ES,es;q=0.9", /^Tu código de inicio de sesión en Checkit/],
	])(
		"sends the email in %s when the browser prefers it",
		async (_language, acceptLanguage, subject) => {
			const emails = captureEmails();

			await requestCode("bob@example.com", {
				"Accept-Language": acceptLanguage,
			});

			expect(emails[0]?.subject).toMatch(subject);
		},
	);

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
		expect(emails[0]?.subject).toBe("Your Checkit sign-in link");

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

describe("crossSubDomainCookies", () => {
	it("shares the session cookie under the given domain", () => {
		expect(crossSubDomainCookies("checkit.example.com")).toEqual({
			crossSubDomainCookies: { enabled: true, domain: "checkit.example.com" },
		});
	});

	it("keeps the cookie on the API's host without a domain", () => {
		expect(crossSubDomainCookies(undefined)).toEqual({});
	});
});
