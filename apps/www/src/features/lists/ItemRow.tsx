import { type Item, itemLabelSchema, type UpdateItem } from "@repo/schemas";
import { Checkbox, cn } from "@repo/ui";
import { PencilIcon, Trash2Icon } from "lucide-react";
import {
	type ComponentPropsWithRef,
	type ReactNode,
	useId,
	useState,
} from "react";
import { IconButton } from "@/components/IconButton";
import { InlineEditForm } from "@/components/InlineEditForm";
import { validateField } from "@/lib/validate-field";
import { m } from "@/paraglide/messages";

export interface ItemRowProps {
	item: Item;
	editable: boolean;
	onUpdate: (changes: UpdateItem) => void;
	onDelete: () => void;
	/** Error message if another item already has this label, checked on rename. */
	labelError?: (label: string) => string | undefined;
	/** Handle to move the item, when the items can be reordered. */
	dragHandle?: ReactNode;
	/** Props of the row's element, set by the reordering. */
	rowProps?: ComponentPropsWithRef<"li">;
}

export function ItemRow({
	item,
	editable,
	onUpdate,
	onDelete,
	dragHandle,
	rowProps,
	labelError,
}: ItemRowProps) {
	const [editing, setEditing] = useState(false);
	const labelId = useId();

	if (editing) {
		return (
			<li {...rowProps} className={cn("py-2", rowProps?.className)}>
				<InlineEditForm
					label={m.rename_item({ label: item.label })}
					defaultValue={item.label}
					onCancel={() => setEditing(false)}
					onSave={(value) => {
						const result = validateField(itemLabelSchema, value);
						if (!result.ok) {
							return result.error;
						}
						const taken = labelError?.(result.value);
						if (taken) {
							return taken;
						}
						if (result.value !== item.label) {
							onUpdate({ label: result.value });
						}
						setEditing(false);
						return undefined;
					}}
				/>
			</li>
		);
	}

	return (
		<li
			{...rowProps}
			className={cn(
				"flex min-h-11 items-center gap-3 py-1",
				rowProps?.className,
			)}
		>
			{dragHandle}
			<Checkbox
				aria-labelledby={labelId}
				checked={item.done}
				disabled={!editable}
				onCheckedChange={(checked) => onUpdate({ done: checked === true })}
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
			{editable && (
				<div className="flex gap-1">
					<IconButton
						icon={PencilIcon}
						label={m.rename_item({ label: item.label })}
						tooltip={m.rename_button()}
						onClick={() => setEditing(true)}
					/>
					<IconButton
						icon={Trash2Icon}
						label={m.delete_item({ label: item.label })}
						tooltip={m.delete_list_confirm()}
						onClick={onDelete}
					/>
				</div>
			)}
		</li>
	);
}
