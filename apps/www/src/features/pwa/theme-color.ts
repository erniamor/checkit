import { type ThemeName, themeBarColors } from "@repo/themes";
import type { Appearance } from "@/features/appearance/appearance";

const LIGHT_QUERY = "(prefers-color-scheme: light)";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Color of the system's bars around the page, for one system appearance. */
function barColor(
	theme: ThemeName,
	appearance: Appearance,
	system: "light" | "dark",
): string {
	const mode = appearance === "system" ? system : appearance;
	return themeBarColors[theme][mode];
}

/**
 * The `theme-color` meta tags: always one per system appearance, so changing
 * the appearance only changes their colors (`applyThemeColor`).
 */
export function themeColorMetas(theme: ThemeName, appearance: Appearance) {
	return [
		{
			name: "theme-color",
			media: LIGHT_QUERY,
			content: barColor(theme, appearance, "light"),
		},
		{
			name: "theme-color",
			media: DARK_QUERY,
			content: barColor(theme, appearance, "dark"),
		},
	];
}

/** Updates the page's `theme-color` after the user changes the appearance or theme. */
export function applyThemeColor(theme: ThemeName, appearance: Appearance) {
	for (const meta of themeColorMetas(theme, appearance)) {
		document
			.querySelector(`meta[name="theme-color"][media="${meta.media}"]`)
			?.setAttribute("content", meta.content);
	}
}
