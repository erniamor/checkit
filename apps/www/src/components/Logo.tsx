import { Link } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

/** The product's mark and name, linking to the home page. */
export function Logo() {
	return (
		<Link
			to="/"
			aria-label={m.logo_home_link()}
			className="flex items-center gap-2 rounded-md font-heading font-semibold text-lg focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
		>
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
				className="size-7 text-primary"
				fill="none"
			>
				<rect width="24" height="24" rx="6" fill="currentColor" />
				<path
					d="m7 12.5 3.2 3.2L17 8.8"
					className="stroke-primary-foreground"
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<span>{m.app_name()}</span>
		</Link>
	);
}
