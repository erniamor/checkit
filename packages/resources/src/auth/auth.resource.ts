import {
	type SendMagicLink,
	type SendSignInCode,
	type SignInWithCode,
	sendMagicLinkSchema,
	sendSignInCodeSchema,
	signInWithCodeSchema,
} from "@repo/schemas";
import { type ApiClient, parseInput } from "../http/client";

/** Passwordless sign-in, through the API's Better Auth routes. */
export function createAuthResource(client: ApiClient) {
	return {
		/** Emails a link that signs the user in and opens `callbackURL`. */
		async sendMagicLink(input: SendMagicLink): Promise<void> {
			await client.request({
				method: "POST",
				path: "/auth/sign-in/magic-link",
				body: parseInput(sendMagicLinkSchema, input),
			});
		},

		/** Emails a 6-digit sign-in code. */
		async sendSignInCode(input: SendSignInCode): Promise<void> {
			const { email } = parseInput(sendSignInCodeSchema, input);
			await client.request({
				method: "POST",
				path: "/auth/email-otp/send-verification-otp",
				body: { email, type: "sign-in" },
			});
		},

		/**
		 * Signs in with the emailed code; the API sets the session cookie. A wrong
		 * code throws a ValidationError with the code "invalid_otp".
		 */
		async signInWithCode(input: SignInWithCode): Promise<void> {
			const { email, code } = parseInput(signInWithCodeSchema, input);
			await client.request({
				method: "POST",
				path: "/auth/sign-in/email-otp",
				body: { email, otp: code },
			});
		},

		async signOut(): Promise<void> {
			await client.request({
				method: "POST",
				path: "/auth/sign-out",
				body: {},
			});
		},
	};
}

export type AuthResource = ReturnType<typeof createAuthResource>;
