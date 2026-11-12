/** Themes offered to the users; the first one is the default. */
export const themes = [
	"stationery",
	"synthwave",
	"garden",
	"brutalist",
	"neutral",
] as const;

export type ThemeName = (typeof themes)[number];

/** Theme applied when `<html>` has no `data-theme` attribute. */
export const defaultTheme: ThemeName = "stationery";

export function isThemeName(value: unknown): value is ThemeName {
	return typeof value === "string" && themes.includes(value as ThemeName);
}

/**
 * Background of the header's band (`--inverse`) per theme and mode, for what
 * the browser paints around the page (`<meta name="theme-color">`), which
 * can't read CSS variables. Kept in sync with the CSS by the tests.
 */
export const themeBarColors: Record<
	ThemeName,
	{ light: string; dark: string }
> = {
	stationery: { light: "#1f2a44", dark: "#0f1424" },
	synthwave: { light: "#1b1033", dark: "#05020d" },
	garden: { light: "#22332a", dark: "#0a0f0b" },
	brutalist: { light: "#ffe600", dark: "#ffe600" },
	neutral: { light: "#171717", dark: "#000000" },
};
