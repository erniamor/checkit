import type { Item, UpdateItem } from "@repo/schemas";
import { useId } from "react";
import { ItemRow } from "@/features/lists/ItemRow";
import { SortableItems } from "@/features/lists/SortableItems";

interface ItemsSectionProps {
	/** Visible title of the section; none for the items still to do. */
	title?: string;
	items: Item[];
	/** Editors also reorder the items, within the section. */
	editable: boolean;
	onUpdate: (itemId: string, changes: UpdateItem) => void;
	onDelete: (itemId: string) => void;
}

export function ItemsSection({
	title,
	items,
	editable,
	onUpdate,
	onDelete,
}: ItemsSectionProps) {
	const titleId = useId();

	if (items.length === 0) {
		return null;
	}
	return (
		<section aria-labelledby={title ? titleId : undefined}>
			{title && (
				<h2
					id={titleId}
					className="mb-1 font-medium text-muted-foreground text-sm uppercase tracking-wide"
				>
					{title}
				</h2>
			)}
			{editable ? (
				<SortableItems items={items} onUpdate={onUpdate} onDelete={onDelete} />
			) : (
				<ul className="divide-y divide-border">
					{items.map((item) => (
						<ItemRow
							key={item.id}
							item={item}
							editable={false}
							onUpdate={(changes) => onUpdate(item.id, changes)}
							onDelete={() => onDelete(item.id)}
						/>
					))}
				</ul>
			)}
		</section>
	);
}
