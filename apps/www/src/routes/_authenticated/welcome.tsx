import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSessionChange } from "@/features/auth/use-session-change";
import { WelcomePage } from "@/features/profile/WelcomePage";
import { redirectSearchSchema } from "@/lib/redirect";

export const Route = createFileRoute("/_authenticated/welcome")({
	validateSearch: redirectSearchSchema,
	beforeLoad: ({ context, search }) => {
		// The name is already chosen: nothing to do here
		if (context.me.name) {
			throw redirect({ href: search.redirect ?? "/" });
		}
	},
	component: WelcomeRoute,
});

function WelcomeRoute() {
	const target = Route.useSearch().redirect ?? "/";
	const session = useSessionChange();

	return <WelcomePage onSaved={() => session.refresh(target)} />;
}
