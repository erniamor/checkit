import { Button } from "@repo/ui";
import { DownloadIcon } from "lucide-react";
import { useId, useState } from "react";
import { IosInstallDialog } from "@/features/pwa/IosInstallDialog";
import { useInstall } from "@/features/pwa/use-install";
import { m } from "@/paraglide/messages";

/**
 * Offers to install the app, where it can be and isn't yet; "Not now" hides
 * it on this device for a while.
 */
export function InstallCard() {
	const { state, installable, dismissed, install, dismiss } = useInstall();
	const [iosHelpOpen, setIosHelpOpen] = useState(false);
	const titleId = useId();

	if (!installable || dismissed) {
		return null;
	}
	return (
		<section
			aria-labelledby={titleId}
			className="grid gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground"
		>
			<div className="grid gap-1">
				<h2 id={titleId} className="font-medium">
					{m.install_title()}
				</h2>
				<p className="text-muted-foreground text-sm">{m.install_text()}</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{state === "ios" ? (
					<Button type="button" size="sm" onClick={() => setIosHelpOpen(true)}>
						{m.install_how_button()}
					</Button>
				) : (
					<Button type="button" size="sm" onClick={() => install()}>
						<DownloadIcon aria-hidden />
						{m.install_button()}
					</Button>
				)}
				<Button type="button" size="sm" variant="ghost" onClick={dismiss}>
					{m.install_later_button()}
				</Button>
			</div>
			<IosInstallDialog open={iosHelpOpen} onOpenChange={setIosHelpOpen} />
		</section>
	);
}
