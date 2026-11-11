import { buttonVariants } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

/** Presents Checkit to visitors; signed-in users go straight to their lists. */
export function HomePage() {
	return (
		<section className="mx-auto max-w-5xl px-4 py-12">
			<h1 className="font-heading font-semibold text-3xl">{m.home_title()}</h1>
			<p className="mt-4 max-w-prose text-muted-foreground">{m.home_intro()}</p>
			<Link to="/sign-in" className={buttonVariants({ className: "mt-6" })}>
				{m.sign_in_link()}
			</Link>
		</section>
	);
}
