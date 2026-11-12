import type { ItemStatus } from "@repo/schemas";
import { Button } from "@repo/ui";
import { itemStatusOptions } from "@/features/items/item-status";
import { m } from "@/paraglide/messages";

interface StatusFilterProps {
	status: ItemStatus;
	onStatusChange: (status: ItemStatus) => void;
}

/** Chooses which items to show: to do, checked, or all. */
export function StatusFilter({ status, onStatusChange }: StatusFilterProps) {
	return (
		<fieldset aria-label={m.items_filter_label()} className="flex gap-1">
			{itemStatusOptions.map((option) => (
				<Button
					key={option.status}
					type="button"
					size="sm"
					variant={option.status === status ? "default" : "outline"}
					aria-pressed={option.status === status}
					onClick={() => onStatusChange(option.status)}
				>
					{option.label()}
				</Button>
			))}
		</fieldset>
	);
}
