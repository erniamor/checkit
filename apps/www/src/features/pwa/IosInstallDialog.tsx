import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui";
import { ShareIcon, SquarePlusIcon } from "lucide-react";
import { m } from "@/paraglide/messages";

interface IosInstallDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** How to install the app on an iPhone or iPad, where the page can't do it. */
export function IosInstallDialog({
	open,
	onOpenChange,
}: IosInstallDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{m.install_ios_title()}</DialogTitle>
					<DialogDescription>{m.install_text()}</DialogDescription>
				</DialogHeader>
				<ol className="grid list-decimal gap-2 ps-5">
					<li>
						{m.install_ios_step_share()}{" "}
						<ShareIcon
							aria-hidden
							className="inline size-4 align-text-bottom"
						/>
					</li>
					<li>
						{m.install_ios_step_add()}{" "}
						<SquarePlusIcon
							aria-hidden
							className="inline size-4 align-text-bottom"
						/>
					</li>
					<li>{m.install_ios_step_confirm()}</li>
				</ol>
				<p className="text-muted-foreground">{m.install_ios_sign_in()}</p>
				<DialogFooter>
					<DialogClose asChild>
						<Button type="button">{m.install_ios_close()}</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
