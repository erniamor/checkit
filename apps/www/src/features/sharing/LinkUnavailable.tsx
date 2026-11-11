import { Link } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

interface LinkUnavailableProps {
	title: string;
	text: string;
}

/** An invitation that expired or was used, or a revoked share link. */
export function LinkUnavailable({ title, text }: LinkUnavailableProps) {
	return (
		<section className="mx-auto max-w-md px-4 py-12">
			<h1 className="font-heading font-semibold text-2xl">{title}</h1>
			<p className="mt-2 text-muted-foreground">{text}</p>
			<Link
				to="/lists"
				className="mt-6 inline-block text-primary underline underline-offset-4"
			>
				{m.go_to_lists()}
			</Link>
		</section>
	);
}
