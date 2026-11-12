import { defaultTheme, themeBarColors } from "@repo/themes";
import { m } from "@/paraglide/messages";
import type { Locale } from "@/paraglide/runtime";

/** Where the installed app opens. */
export const START_URL = "/lists";

/** The web app manifest, in the given language: what installing the app shows. */
export function webManifest(locale: Locale) {
	const color = themeBarColors[defaultTheme].light;
	return {
		id: "/",
		name: m.app_name({}, { locale }),
		short_name: m.app_name({}, { locale }),
		description: m.pwa_description({}, { locale }),
		lang: locale,
		start_url: START_URL,
		scope: "/",
		display: "standalone",
		// The header's band: the splash screen and the window match it
		background_color: color,
		theme_color: color,
		icons: [
			{ src: "/icon-192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icon-512.png", sizes: "512x512", type: "image/png" },
			{
				src: "/icon-maskable-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
		shortcuts: [
			{ name: m.lists_title({}, { locale }), url: "/lists" },
			{ name: m.items_title({}, { locale }), url: "/items" },
		],
	};
}
