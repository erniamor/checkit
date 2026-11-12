import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { getApi } from "@/lib/api";

export type SignInStep =
	| { kind: "email" }
	| { kind: "check-email"; email: string }
	| { kind: "code"; email: string };

interface UseSignInOptions {
	/** Internal path to open once signed in. */
	redirect: string;
	onSignedIn: () => void | Promise<void>;
	/**
	 * Skip the link and send a code at once: in the app installed on iOS, the
	 * link would open in Safari, which doesn't share the app's session.
	 */
	codeOnly?: boolean;
}

/**
 * The sign-in steps: email, then "check your email" (magic link), with a
 * one-time code as a fallback.
 */
export function useSignIn({
	redirect,
	onSignedIn,
	codeOnly = false,
}: UseSignInOptions) {
	const [step, setStep] = useState<SignInStep>({ kind: "email" });

	const sendLink = useMutation({
		mutationFn: (email: string) =>
			getApi().auth.sendMagicLink({
				email,
				// The link opens this page of the app, on the device that asked for it
				callbackURL: new URL(redirect, window.location.origin).href,
			}),
		onSuccess: (_, email) => setStep({ kind: "check-email", email }),
	});

	const sendCode = useMutation({
		mutationFn: (email: string) => getApi().auth.sendSignInCode({ email }),
		onSuccess: (_, email) => setStep({ kind: "code", email }),
	});

	const signIn = useMutation({
		mutationFn: (input: { email: string; code: string }) =>
			getApi().auth.signInWithCode(input),
		onSuccess: onSignedIn,
	});

	function restart() {
		sendLink.reset();
		sendCode.reset();
		signIn.reset();
		setStep({ kind: "email" });
	}

	/** The first step: the link, or the code when it's the only way. */
	const sendEmail = codeOnly ? sendCode : sendLink;

	return { step, sendEmail, sendCode, signIn, restart };
}
