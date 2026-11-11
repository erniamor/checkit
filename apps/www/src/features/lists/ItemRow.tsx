import { type Item, itemLabelSchema, type UpdateItem } from "@repo/schemas";
import { Checkbox, cn } from "@repo/ui";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { IconButton } from "@/components/IconButton";
import { InlineEditForm } from "@/components/InlineEditForm";
import { validateField } from "@/lib/validate-field";
import { m } from "@/paraglide/messages";

interface ItemRowProps {
	item: Item;
	editable: boolean;
	onUpdate: (changes: UpdateItem) => void;
	onDelete: () => void;
}

export function ItemRow({ item, editable, onUpdate, onDelete }: ItemRowProps) {
	const [editing, setEditing] = useState(false);
	const labelId = useId();

	if (editing) {
		return (
			<li className="py-2">
				<InlineEditForm
					label={m.rename_item({ label: item.label })}
					defaultValue={item.label}
					onCancel={() => setEditing(false)}
					onSave={(value) => {
						const result = validateField(itemLabelSchema, value);
						if (!result.ok) {
							return result.error;
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
		<li className="flex min-h-11 items-center gap-3 py-1">
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
