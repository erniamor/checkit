import { createFileRoute } from "@tanstack/react-router";
import { webManifest } from "@/features/pwa/manifest";
import { getLocale, isLocale } from "@/paraglide/runtime";

// The manifest is fetched without cookies: the page asks for its language
export const Route = createFileRoute("/manifest.webmanifest")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const lang = new URL(request.url).searchParams.get("lang");
				const locale = isLocale(lang) ? lang : getLocale();
				return new Response(JSON.stringify(webManifest(locale)), {
					headers: {
						"Content-Type": "application/manifest+json",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
