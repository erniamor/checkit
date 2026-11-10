export const themes = ["brand", "neutral"] as const;

export type ThemeName = (typeof themes)[number];

/** Theme applied when `<html>` has no `data-theme` attribute. */
export const defaultTheme: ThemeName = "brand";

export function isThemeName(value: unknown): value is ThemeName {
	return typeof value === "string" && themes.includes(value as ThemeName);
}
