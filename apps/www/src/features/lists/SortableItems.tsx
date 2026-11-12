import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Item, UpdateItem } from "@repo/schemas";
import { useId } from "react";
import {
	itemAnnouncements,
	itemScreenReaderInstructions,
} from "@/features/lists/item-announcements";
import { movedPosition } from "@/features/lists/item-position";
import { SortableItemRow } from "@/features/lists/SortableItemRow";

interface SortableItemsProps {
	/** In display order. */
	items: Item[];
	onUpdate: (itemId: string, changes: UpdateItem) => void;
	onDelete: (itemId: string) => void;
}

/** Items the user can reorder; each move saves the item's new position. */
export function SortableItems({
	items,
	onUpdate,
	onDelete,
}: SortableItemsProps) {
	// Stable between the server and the browser, for the screen reader texts' ids
	const id = useId();
	const sensors = useSensors(
		useSensor(MouseSensor),
		// A short press first: a finger scrolling the page doesn't move items
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over) {
			return;
		}
		const position = movedPosition(items, String(active.id), String(over.id));
		if (position !== undefined) {
			onUpdate(String(active.id), { position });
		}
	}

	return (
		<DndContext
			id={id}
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			accessibility={{
				announcements: itemAnnouncements(items),
				screenReaderInstructions: itemScreenReaderInstructions(),
			}}
		>
			<SortableContext
				items={items.map((item) => item.id)}
				strategy={verticalListSortingStrategy}
			>
				<ul className="divide-y divide-border">
					{items.map((item) => (
						<SortableItemRow
							key={item.id}
							item={item}
							editable
							onUpdate={(changes) => onUpdate(item.id, changes)}
							onDelete={() => onDelete(item.id)}
						/>
					))}
				</ul>
			</SortableContext>
		</DndContext>
	);
}
