import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { SignInPage } from "@/features/auth/SignInPage";
import { useSessionChange } from "@/features/auth/use-session-change";
import { redirectSearchSchema } from "@/lib/redirect";

const signInSearchSchema = redirectSearchSchema.extend({
	// Prefills the field, e.g. from an invitation; validated when sending
	email: z.string().max(320).optional().catch(undefined),
});

export const Route = createFileRoute("/sign-in")({
	validateSearch: signInSearchSchema,
	beforeLoad: ({ context, search }) => {
		if (context.me) {
			throw redirect({ href: search.redirect ?? "/" });
		}
	},
	component: SignInRoute,
});

function SignInRoute() {
	const { redirect: target = "/", email } = Route.useSearch();
	const session = useSessionChange();

	return (
		<SignInPage
			redirect={target}
			defaultEmail={email}
			onSignedIn={() => session.refresh(target)}
		/>
	);
}
