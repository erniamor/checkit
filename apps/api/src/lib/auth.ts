import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins/email-otp";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { signInCodeEmail, signInLinkEmail } from "@/emails/sign-in";
import { env } from "@/env";
import { resolveLocale } from "@/lib/locale";
import { mailer } from "@/lib/mailer";

const SIGN_IN_EXPIRES_IN_MINUTES = 10;

interface RequestContext {
	headers?: Headers | undefined;
	request?: Request | undefined;
}

function localeOf(ctx: RequestContext | undefined) {
	const headers = ctx?.headers ?? ctx?.request?.headers;
	return resolveLocale(headers?.get("accept-language"));
}

const googleProvider =
	env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
		? {
				google: {
					clientId: env.GOOGLE_CLIENT_ID,
					clientSecret: env.GOOGLE_CLIENT_SECRET,
				},
			}
		: {};

// Passwordless sign-in: magic link, one-time code by email, and Google once configured.
// Password sign-in (emailAndPassword) stays disabled.
export const auth = betterAuth({
	appName: "Checkit",
	baseURL: env.API_URL,
	basePath: "/v1/auth",
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: env.CORS_ORIGINS,
	database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
	advanced: {
		database: { generateId: "uuid" },
		// Better Auth skips the callback URL and origin checks when NODE_ENV is "test":
		// keep them on so the tests run with the production behavior
		disableOriginCheck: false,
	},
	telemetry: { enabled: false },
	socialProviders: googleProvider,
	plugins: [
		magicLink({
			expiresIn: SIGN_IN_EXPIRES_IN_MINUTES * 60,
			storeToken: "hashed",
			sendMagicLink: ({ email, url }, ctx) =>
				mailer.send(
					signInLinkEmail({
						to: email,
						url,
						locale: localeOf(ctx),
						expiresInMinutes: SIGN_IN_EXPIRES_IN_MINUTES,
					}),
				),
		}),
		emailOTP({
			expiresIn: SIGN_IN_EXPIRES_IN_MINUTES * 60,
			storeOTP: "hashed",
			sendVerificationOTP: ({ email, otp }, ctx) =>
				mailer.send(
					signInCodeEmail({
						to: email,
						code: otp,
						locale: localeOf(ctx),
						expiresInMinutes: SIGN_IN_EXPIRES_IN_MINUTES,
					}),
				),
		}),
	],
});

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;
