import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
} from "@repo/ui";
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
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button type="button" variant="ghost" size="sm" disabled={pending}>
					{m.delete_list_button()}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{m.delete_list_title({ name })}</AlertDialogTitle>
					<AlertDialogDescription>
						{m.delete_list_text()}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{m.cancel_button()}</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={onConfirm}>
						{m.delete_list_confirm()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
