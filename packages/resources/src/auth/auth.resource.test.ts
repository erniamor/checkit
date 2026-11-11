import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { fakeApi } from "../test/fake-fetch";

describe("auth", () => {
	it("sends a magic link", async () => {
		const { api, requests } = fakeApi(200, { status: true });

		await api.auth.sendMagicLink({
			email: " Alice@Example.com",
			callbackURL: "http://app.test/lists",
		});

		expect(requests[0]).toMatchObject({
			url: "http://api.test/v1/auth/sign-in/magic-link",
			method: "POST",
			body: {
				email: "alice@example.com",
				callbackURL: "http://app.test/lists",
			},
			headers: { "accept-language": "fr" },
		});
	});

	it("sends a sign-in code", async () => {
		const { api, requests } = fakeApi(200, { success: true });

		await api.auth.sendSignInCode({ email: "alice@example.com" });

		expect(requests[0]).toMatchObject({
			url: "http://api.test/v1/auth/email-otp/send-verification-otp",
			body: { email: "alice@example.com", type: "sign-in" },
		});
	});

	it("signs in with a code", async () => {
		const { api, requests } = fakeApi(200, { token: "t", user: {} });

		await api.auth.signInWithCode({
			email: "alice@example.com",
			code: "123456",
		});

		expect(requests[0]).toMatchObject({
			url: "http://api.test/v1/auth/sign-in/email-otp",
			body: { email: "alice@example.com", otp: "123456" },
		});
	});

	it("rejects an invalid email or code before sending", async () => {
		const { api, fetch } = fakeApi(200, {});

		const error = await api.auth
			.signInWithCode({ email: "nope", code: "12" })
			.catch((e: unknown) => e);

		expect(fetch).not.toHaveBeenCalled();
		expect(error).toBeInstanceOf(ValidationError);
		expect((error as ValidationError).issues).toEqual([
			{ field: "email", message: "email_invalid" },
			{ field: "code", message: "code_invalid" },
		]);
	});

	it("reports a wrong code", async () => {
		const { api } = fakeApi(400, {
			code: "INVALID_OTP",
			message: "Invalid OTP",
		});

		await expect(
			api.auth.signInWithCode({ email: "alice@example.com", code: "000000" }),
		).rejects.toMatchObject({ code: "invalid_otp" });
	});

	it("signs out", async () => {
		const { api, requests } = fakeApi(200, { success: true });

		await api.auth.signOut();

		expect(requests[0]).toMatchObject({
			url: "http://api.test/v1/auth/sign-out",
			method: "POST",
		});
	});
});
