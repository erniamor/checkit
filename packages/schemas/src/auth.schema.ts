import { z } from "zod";
import { emailSchema } from "./common";

export const SIGN_IN_CODE_LENGTH = 6;

/** Sign-in by magic link: the link opens `callbackURL`, a page of the front end. */
export const sendMagicLinkSchema = z.strictObject({
	email: emailSchema,
	callbackURL: z.url(),
});

export type SendMagicLink = z.infer<typeof sendMagicLinkSchema>;

export const sendSignInCodeSchema = z.strictObject({ email: emailSchema });

export type SendSignInCode = z.infer<typeof sendSignInCodeSchema>;

export const signInWithCodeSchema = z.strictObject({
	email: emailSchema,
	// trim(): a code pasted with surrounding spaces is still valid
	code: z
		.string()
		.trim()
		.regex(new RegExp(`^\\d{${SIGN_IN_CODE_LENGTH}}$`), "code_invalid"),
});

export type SignInWithCode = z.infer<typeof signInWithCodeSchema>;
