import { Link } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

export function NotFound() {
	return (
		<section className="mx-auto max-w-5xl px-4 py-12">
			<h1 className="font-heading font-semibold text-2xl">
				{m.not_found_title()}
			</h1>
			<p className="mt-2 text-muted-foreground">{m.not_found_text()}</p>
			<Link
				to="/"
				className="mt-6 inline-block text-primary underline underline-offset-4"
			>
				{m.not_found_home_link()}
			</Link>
		</section>
	);
}
