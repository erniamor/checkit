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
import type { LucideIcon } from "lucide-react";
import { WithTooltip } from "@/components/WithTooltip";
import { m } from "@/paraglide/messages";

interface ConfirmButtonProps {
	/** Visible text of the button, or its tooltip when it shows an icon. */
	label: string;
	/** Accessible name, when the label isn't enough ("Remove" → "Remove Bob"). */
	ariaLabel?: string;
	/** Shows this icon instead of the label, which becomes a tooltip. */
	icon?: LucideIcon;
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
	icon: Icon,
	title,
	description,
	confirmLabel,
	pending = false,
	onConfirm,
}: ConfirmButtonProps) {
	const trigger = (
		<AlertDialogTrigger asChild>
			<Button
				type="button"
				variant="ghost"
				size={Icon ? "icon" : "sm"}
				aria-label={ariaLabel ?? (Icon ? label : undefined)}
				disabled={pending}
			>
				{Icon ? <Icon aria-hidden className="size-4" /> : label}
			</Button>
		</AlertDialogTrigger>
	);

	return (
		<AlertDialog>
			{Icon ? <WithTooltip label={label}>{trigger}</WithTooltip> : trigger}
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
