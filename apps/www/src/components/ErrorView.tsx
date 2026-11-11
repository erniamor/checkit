import { Button } from "@repo/ui";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

/** Shown when a route fails to load or render; never shows the error's details. */
export function ErrorView({ reset }: ErrorComponentProps) {
	const router = useRouter();

	return (
		<section role="alert" className="mx-auto max-w-5xl px-4 py-12">
			<h1 className="font-heading font-semibold text-2xl">{m.error_title()}</h1>
			<Button
				className="mt-6"
				onClick={() => {
					reset();
					void router.invalidate();
				}}
			>
				{m.error_retry()}
			</Button>
		</section>
	);
}
