import { defaultTheme, isThemeName, type ThemeName } from "@repo/themes";
import { getPublicEnv } from "@/env";
import { writePreferenceCookie } from "@/lib/cookies";

export const THEME_COOKIE = "theme";

/**
 * The theme menu previews the theme variants: in development, or where
 * VITE_THEME_SWITCHER is "true" (e.g. staging). Never in production otherwise.
 */
export function isThemeSwitcherEnabled(): boolean {
	return import.meta.env.DEV || getPublicEnv().VITE_THEME_SWITCHER === "true";
}

/** The theme to render: the cookie's, when the switcher is enabled. */
export function parseTheme(value: unknown): ThemeName {
	return isThemeSwitcherEnabled() && isThemeName(value) ? value : defaultTheme;
}

/** Applies the theme to the page and remembers it for the next visits. */
export function applyTheme(theme: ThemeName): void {
	writePreferenceCookie(THEME_COOKIE, theme);
	document.documentElement.dataset.theme = theme;
}
