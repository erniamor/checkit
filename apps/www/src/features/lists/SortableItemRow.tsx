import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@repo/ui";
import { GripVerticalIcon } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { ItemRow, type ItemRowProps } from "@/features/lists/ItemRow";
import { m } from "@/paraglide/messages";

type SortableItemRowProps = Omit<ItemRowProps, "dragHandle" | "rowProps">;

/** An item that can be moved by its handle, with the mouse, a finger or the keyboard. */
export function SortableItemRow(props: SortableItemRowProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: props.item.id,
		attributes: { roleDescription: m.dnd_role_description() },
	});

	return (
		<ItemRow
			{...props}
			rowProps={{
				ref: setNodeRef,
				// Set by dnd-kit while the item moves: no class can express it
				style: { transform: CSS.Translate.toString(transform), transition },
				className: cn(isDragging && "relative z-10 bg-background shadow-md"),
			}}
			dragHandle={
				<IconButton
					ref={setActivatorNodeRef}
					icon={GripVerticalIcon}
					label={m.move_item({ label: props.item.label })}
					tooltip={m.move_button()}
					// The handle receives the drag gestures instead of scrolling
					className="cursor-grab touch-none active:cursor-grabbing"
					{...attributes}
					{...listeners}
				/>
			}
		/>
	);
}
