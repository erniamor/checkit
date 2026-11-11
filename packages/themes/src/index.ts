export const themes = [
	"brand",
	"neutral",
	// Variants presented to choose the product's identity: once one is chosen,
	// it becomes "brand" and the others are deleted
	"variant-a",
	"variant-b",
	"variant-c",
	"variant-d",
	"variant-e",
] as const;

export type ThemeName = (typeof themes)[number];

/** Theme applied when `<html>` has no `data-theme` attribute. */
export const defaultTheme: ThemeName = "brand";

export function isThemeName(value: unknown): value is ThemeName {
	return typeof value === "string" && themes.includes(value as ThemeName);
}
