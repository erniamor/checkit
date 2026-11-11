import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignInPage } from "@/features/auth/SignInPage";
import { useSessionChange } from "@/features/auth/use-session-change";
import { redirectSearchSchema } from "@/lib/redirect";

export const Route = createFileRoute("/sign-in")({
	validateSearch: redirectSearchSchema,
	beforeLoad: ({ context, search }) => {
		if (context.me) {
			throw redirect({ href: search.redirect ?? "/" });
		}
	},
	component: SignInRoute,
});

function SignInRoute() {
	const target = Route.useSearch().redirect ?? "/";
	const session = useSessionChange();

	return (
		<SignInPage redirect={target} onSignedIn={() => session.refresh(target)} />
	);
}
