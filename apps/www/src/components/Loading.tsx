import { m } from "@/paraglide/messages";

/** Shown while a page loads its data. */
export function Loading() {
	return (
		<p
			role="status"
			className="mx-auto max-w-5xl px-4 py-12 text-muted-foreground"
		>
			{m.loading()}
		</p>
	);
}
