import { createFileRoute, redirect } from "@tanstack/react-router";

// Layout of the pages reserved to signed-in users: visitors are sent to the
// sign-in page, then brought back
export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		if (!context.me) {
			throw redirect({ to: "/sign-in", search: { redirect: location.href } });
		}
		return { me: context.me };
	},
});
