import type { ItemWithList } from "@repo/schemas";
import { Checkbox, cn } from "@repo/ui";
import { useId } from "react";

interface CheckableItemProps {
	item: ItemWithList;
	editable: boolean;
	onCheckedChange: (done: boolean) => void;
}

/** An item that can only be checked or unchecked; the rest is done in its list. */
export function CheckableItem({
	item,
	editable,
	onCheckedChange,
}: CheckableItemProps) {
	const labelId = useId();

	return (
		<li className="flex min-h-11 items-center gap-3 py-1">
			<Checkbox
				aria-labelledby={labelId}
				checked={item.done}
				disabled={!editable}
				onCheckedChange={(checked) => onCheckedChange(checked === true)}
				className="size-5"
			/>
			<span
				id={labelId}
				className={cn(
					"flex-1 break-words",
					item.done && "text-muted-foreground line-through",
				)}
			>
				{item.label}
			</span>
		</li>
	);
}
