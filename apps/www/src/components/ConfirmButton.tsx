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

interface ConfirmButtonProps {
	/** Visible text of the button. */
	label: string;
	/** Accessible name, when the visible text isn't enough ("Remove" → "Remove Bob"). */
	ariaLabel?: string;
	title: string;
	description: string;
	confirmLabel: string;
	pending?: boolean;
	onConfirm: () => void;
}

/** A button whose action, which can't be undone, asks for a confirmation first. */
export function ConfirmButton({
	label,
	ariaLabel,
	title,
	description,
	confirmLabel,
	pending = false,
	onConfirm,
}: ConfirmButtonProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					aria-label={ariaLabel}
					disabled={pending}
				>
					{label}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{m.cancel_button()}</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={onConfirm}>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
