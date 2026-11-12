import { Link } from "@tanstack/react-router";
import { useId } from "react";
import { CheckableItem } from "@/features/items/CheckableItem";
import type { ListGroup } from "@/features/items/item-status";
import { canEdit } from "@/features/lists/permissions";

interface ListItemsGroupProps {
	group: ListGroup;
	onCheckedChange: (item: ListGroup["items"][number], done: boolean) => void;
}

/** The items of one list, under its name linking to the list. */
export function ListItemsGroup({
	group,
	onCheckedChange,
}: ListItemsGroupProps) {
	const titleId = useId();
	const editable = canEdit(group.list.role);

	return (
		<section aria-labelledby={titleId}>
			<h2 id={titleId} className="mb-1 font-heading font-medium text-lg">
				<Link
					to="/lists/$listId"
					params={{ listId: group.list.id }}
					className="break-words underline-offset-4 hover:underline"
				>
					{group.list.name}
				</Link>
			</h2>
			<ul className="divide-y divide-border">
				{group.items.map((item) => (
					<CheckableItem
						key={item.id}
						item={item}
						editable={editable}
						onCheckedChange={(done) => onCheckedChange(item, done)}
					/>
				))}
			</ul>
		</section>
	);
}
