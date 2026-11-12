import { Button } from "@repo/ui";
import { WifiOffIcon } from "lucide-react";
import { useEffect } from "react";
import { m } from "@/paraglide/messages";

interface OfflinePageProps {
	/** Opens again the page that couldn't load. */
	onRetry: () => void;
}

/** Shown by the service worker when a page can't load without a connection. */
export function OfflinePage({ onRetry }: OfflinePageProps) {
	// Syncs with the browser's connection: back online, retry by itself
	useEffect(() => {
		window.addEventListener("online", onRetry);
		return () => window.removeEventListener("online", onRetry);
	}, [onRetry]);

	return (
		<section className="mx-auto grid max-w-md justify-items-start gap-4 px-4 py-12">
			<WifiOffIcon aria-hidden className="size-8 text-muted-foreground" />
			<h1 className="font-heading font-semibold text-2xl">
				{m.offline_title()}
			</h1>
			<p className="text-muted-foreground">{m.offline_text()}</p>
			<Button type="button" onClick={onRetry}>
				{m.offline_retry()}
			</Button>
		</section>
	);
}
