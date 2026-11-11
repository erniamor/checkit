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
