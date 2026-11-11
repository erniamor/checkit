import { createFileRoute, redirect } from "@tanstack/react-router";
import { HomePage } from "@/features/home/HomePage";

export const Route = createFileRoute("/")({
	// The home page presents Checkit to visitors; signed-in users go to their lists
	beforeLoad: ({ context }) => {
		if (context.me) {
			throw redirect({ to: "/lists" });
		}
	},
	component: HomePage,
});
