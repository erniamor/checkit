import { useSuspenseQuery } from "@tanstack/react-query";
import { CreateListForm } from "@/features/lists/CreateListForm";
import { ListCard } from "@/features/lists/ListCard";
import { listsQueryOptions } from "@/features/lists/queries";
import { m } from "@/paraglide/messages";

/** "My lists": the lists the user owns or that are shared with them. */
export function ListsPage() {
	const { data: page } = useSuspenseQuery(listsQueryOptions());

	return (
		<section className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
			<h1 className="font-heading font-semibold text-2xl">{m.lists_title()}</h1>
			<CreateListForm />
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
