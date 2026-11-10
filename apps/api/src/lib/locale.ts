export const locales = ["en", "fr", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

function isLocale(value: string): value is Locale {
	return (locales as readonly string[]).includes(value);
}

/** Picks the user's preferred supported locale from an `Accept-Language` header. */
export function resolveLocale(
	acceptLanguage: string | null | undefined,
): Locale {
	if (!acceptLanguage) {
		return defaultLocale;
	}

	const ranked = acceptLanguage
		.split(",")
		.map((part, index) => {
			const [tag = "", ...params] = part.trim().split(";");
			const qualityParam = params
				.map((param) => param.trim())
				.find((param) => param.startsWith("q="));
			const quality = qualityParam ? Number(qualityParam.slice(2)) : 1;
			return {
				language: tag.split("-")[0]?.toLowerCase() ?? "",
				quality: Number.isNaN(quality) ? 0 : quality,
				index,
			};
		})
		.filter((entry) => entry.quality > 0)
		.sort((a, b) => b.quality - a.quality || a.index - b.index);

	for (const { language } of ranked) {
		if (isLocale(language)) {
			return language;
		}
	}
	return defaultLocale;
}
