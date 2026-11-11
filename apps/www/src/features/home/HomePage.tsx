import { m } from "@/paraglide/messages";

export function HomePage() {
	return (
		<section className="mx-auto max-w-5xl px-4 py-12">
			<h1 className="font-heading font-semibold text-3xl">{m.home_title()}</h1>
			<p className="mt-4 max-w-prose text-muted-foreground">{m.home_intro()}</p>
		</section>
	);
}
