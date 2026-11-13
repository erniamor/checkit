import { normalizeItemLabel } from "@repo/schemas";
import type { Locale } from "@/paraglide/runtime";

// Words between items, as whole words: "milk and eggs", "lait puis œufs"
const connectors: Record<Locale, string[]> = {
	en: ["and", "then"],
	fr: ["et", "puis", "ensuite"],
	es: ["y", "e", "luego", "después"],
};

// Articles dropped at the start of an item: "some milk" is "Milk"
const leadingArticles: Record<Locale, RegExp> = {
	en: /^(?:an?|the|some)\s+/iu,
	// "de l'" before "de": the longest article first
	fr: /^(?:(?:de l|l|d)['’]\s*|(?:de la|du|des|les|le|la|une?|de)\s+)/iu,
	es: /^(?:el|la|los|las|unos?|unas?)\s+/iu,
};

function separator(locale: Locale): RegExp {
	const words = connectors[locale].join("|");
	return new RegExp(`[,;.]|(?<=^|\\s)(?:${words})(?=\\s|$)`, "iu");
}

function toLabel(part: string, locale: Locale): string {
	const label = part.replace(/\s+/g, " ").trim();
	// An item made only of an article ("la") stays as said
	const withoutArticle = label.replace(leadingArticles[locale], "") || label;
	return (
		withoutArticle.charAt(0).toLocaleUpperCase(locale) + withoutArticle.slice(1)
	);
}

/**
 * The items in a spoken sentence: "du lait, des œufs et du pain" gives
 * ["Lait", "Œufs", "Pain"]. Repeated items are kept once.
 */
export function splitSpokenItems(text: string, locale: Locale): string[] {
	const seen = new Set<string>();
	return text
		.split(separator(locale))
		.map((part) => toLabel(part, locale))
		.filter((label) => {
			const key = normalizeItemLabel(label);
			if (key === "" || seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});
}
