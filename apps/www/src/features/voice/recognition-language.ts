import type { Locale } from "@/paraglide/runtime";

const defaultRegions: Record<Locale, string> = {
	en: "en-US",
	fr: "fr-FR",
	es: "es-ES",
};

/**
 * The language to recognize: the app's, in the browser's regional variant
 * when it has one (French in a browser set to fr-CA is recognized as fr-CA).
 */
export function recognitionLanguage(
	locale: Locale,
	browserLanguages: readonly string[],
): string {
	return (
		browserLanguages.find((tag) =>
			tag.toLowerCase().startsWith(`${locale}-`),
		) ?? defaultRegions[locale]
	);
}
