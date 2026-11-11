import { Link } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

/** A list that doesn't exist, or that the user can't see: the API doesn't tell them apart. */
export function ListNotFound() {
	return (
		<section className="mx-auto max-w-2xl px-4 py-12">
			<h1 className="font-heading font-semibold text-2xl">
				{m.list_not_found_title()}
			</h1>
			<p className="mt-2 text-muted-foreground">{m.list_not_found_text()}</p>
			<Link
				to="/lists"
				className="mt-6 inline-block text-primary underline underline-offset-4"
			>
				{m.back_to_lists()}
			</Link>
		</section>
	);
}
