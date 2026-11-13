import { Trash2Icon } from "lucide-react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { m } from "@/paraglide/messages";

interface DeleteItemButtonProps {
	label: string;
	onConfirm: () => void;
}

/** Deletes an item after a confirmation: it's gone for every member. */
export function DeleteItemButton({ label, onConfirm }: DeleteItemButtonProps) {
	return (
		<ConfirmButton
			label={m.delete_list_confirm()}
			ariaLabel={m.delete_item({ label })}
			icon={Trash2Icon}
			title={m.delete_item_title({ label })}
			description={m.delete_item_text()}
			confirmLabel={m.delete_list_confirm()}
			onConfirm={onConfirm}
		/>
	);
}
