import { Link } from "@tanstack/react-router";
import { CreateListForm } from "@/features/lists/CreateListForm";
import { m } from "@/paraglide/messages";

/** Creates a list, on its own page: the back button simply leaves it. */
export function NewListPage() {
	return (
		<section className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
			<Link
				to="/lists"
				className="text-muted-foreground text-sm underline-offset-4 hover:underline"
			>
				← {m.back_to_lists()}
			</Link>
			<header className="grid gap-1">
				<h1 className="font-heading font-semibold text-2xl">
					{m.create_list_label()}
				</h1>
				<p className="text-muted-foreground">{m.create_list_text()}</p>
			</header>
			<CreateListForm />
		</section>
	);
}
