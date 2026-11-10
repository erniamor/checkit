import { vi } from "vitest";
import { app } from "@/app";
import { type EmailMessage, mailer } from "@/lib/mailer";

export const WEB_ORIGIN = "http://localhost:3000";

export const jsonHeaders = {
	"Content-Type": "application/json",
	Origin: WEB_ORIGIN,
};

/** Stops emails from being printed and collects them instead. */
export function captureEmails(): EmailMessage[] {
	const sent: EmailMessage[] = [];
	vi.spyOn(mailer, "send").mockImplementation(async (message) => {
		sent.push(message);
	});
	return sent;
}

export function extractCode(email: EmailMessage | undefined): string {
	const code = email?.text.match(/\b\d{6}\b/)?.[0];
	if (!code) {
		throw new Error("No sign-in code found in the email");
	}
	return code;
}

/** Turns a response's `Set-Cookie` headers into a `Cookie` request header. */
export function cookieHeader(response: Response): string {
	return response.headers
		.getSetCookie()
		.map((cookie) => cookie.split(";")[0])
		.join("; ");
}

/** Signs in with an email code (creating the account if needed) and returns the session cookie. */
export async function signIn(email: string): Promise<string> {
	const emails = captureEmails();
	await app.request("/v1/auth/email-otp/send-verification-otp", {
		method: "POST",
		headers: jsonHeaders,
		body: JSON.stringify({ email, type: "sign-in" }),
	});
	const response = await app.request("/v1/auth/sign-in/email-otp", {
		method: "POST",
		headers: jsonHeaders,
		body: JSON.stringify({ email, otp: extractCode(emails.at(-1)) }),
	});
	if (!response.ok) {
		throw new Error(`Sign-in failed with status ${response.status}`);
	}
	return cookieHeader(response);
}
