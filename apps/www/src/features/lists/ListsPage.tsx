import { buttonVariants } from "@repo/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { ListCard } from "@/features/lists/ListCard";
import { listsQueryOptions } from "@/features/lists/queries";
import { InstallCard } from "@/features/pwa/InstallCard";
import { m } from "@/paraglide/messages";

/** "My lists": the lists the user owns or that are shared with them. */
export function ListsPage() {
	const { data: page } = useSuspenseQuery(listsQueryOptions());

	return (
		<section className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
			<header className="flex flex-wrap items-center justify-between gap-2">
				<h1 className="font-heading font-semibold text-2xl">
					{m.lists_title()}
				</h1>
				<Link to="/lists/new" className={buttonVariants()}>
					<PlusIcon aria-hidden className="size-4" />
					{m.create_list_label()}
				</Link>
			</header>
			<InstallCard />
			{page.items.length === 0 ? (
				<p className="text-muted-foreground">{m.lists_empty()}</p>
			) : (
				<ul className="grid gap-2">
					{page.items.map((list) => (
						<ListCard key={list.id} list={list} />
					))}
				</ul>
			)}
		</section>
	);
}
