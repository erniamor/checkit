import type { List } from "@repo/schemas";
import { Link } from "@tanstack/react-router";
import { ListKindIcon } from "@/features/lists/ListKindIcon";
import { isOwner } from "@/features/lists/permissions";
import { m } from "@/paraglide/messages";

interface ListCardProps {
	list: List;
}

export function ListCard({ list }: ListCardProps) {
	return (
		<li>
			<Link
				to="/lists/$listId"
				params={{ listId: list.id }}
				className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
			>
				<span className="flex min-w-0 items-center gap-2">
					<ListKindIcon kind={list.kind} />
					<span className="break-words font-medium">{list.name}</span>
				</span>
				{/* Spaces between the parts of the link's name, when read */}{" "}
				<span className="flex items-center gap-2 text-muted-foreground text-sm">
					{!isOwner(list.role) && (
						<span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
							{m.list_shared()}
						</span>
					)}{" "}
					{m.list_progress({
						done: String(list.doneCount),
						total: String(list.itemCount),
					})}
				</span>
			</Link>
		</li>
	);
}
