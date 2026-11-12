import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { START_URL } from "@/features/pwa/manifest";
import { OfflinePage } from "@/features/pwa/OfflinePage";
import { isInternalPath } from "@/lib/redirect";

// Set by the service worker; only a path of this app is kept
const offlineSearchSchema = z.object({
	from: z.string().refine(isInternalPath).optional().catch(undefined),
});

export const Route = createFileRoute("/offline")({
	validateSearch: offlineSearchSchema,
	component: OfflineRoute,
});

function OfflineRoute() {
	const { from = START_URL } = Route.useSearch();
	// A full load: the service worker answers it, with the page or offline again
	return <OfflinePage onRetry={() => window.location.assign(from)} />;
}
