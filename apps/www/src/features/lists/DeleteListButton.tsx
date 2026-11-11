import { Trash2Icon } from "lucide-react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { m } from "@/paraglide/messages";

interface DeleteListButtonProps {
	name: string;
	pending: boolean;
	onConfirm: () => void;
}

/** Deletes the list after a confirmation: it can't be undone. */
export function DeleteListButton({
	name,
	pending,
	onConfirm,
}: DeleteListButtonProps) {
	return (
		<ConfirmButton
			label={m.delete_list_button()}
			icon={Trash2Icon}
			title={m.delete_list_title({ name })}
			description={m.delete_list_text()}
			confirmLabel={m.delete_list_confirm()}
			pending={pending}
			onConfirm={onConfirm}
		/>
	);
}
