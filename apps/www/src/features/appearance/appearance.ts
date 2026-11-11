import { z } from "zod";
import { writePreferenceCookie } from "@/lib/cookies";

export const appearances = ["light", "dark", "system"] as const;

export type Appearance = (typeof appearances)[number];

export const APPEARANCE_COOKIE = "appearance";

const DARK_QUERY = "(prefers-color-scheme: dark)";

// A missing or unexpected cookie value falls back to the system's appearance
const appearanceSchema = z.enum(appearances).catch("system");

export function parseAppearance(value: unknown): Appearance {
	return appearanceSchema.parse(value);
}

export function isDark(appearance: Appearance, systemIsDark: boolean): boolean {
	return appearance === "dark" || (appearance === "system" && systemIsDark);
}

/**
 * Class of `<html>` rendered by the server. With "system", the server can't
 * know the system's appearance: `systemAppearanceScript` sets it before the
 * first paint.
 */
export function serverHtmlClass(appearance: Appearance): string | undefined {
	return appearance === "dark" ? "dark" : undefined;
}

export const systemAppearanceScript = `document.documentElement.classList.toggle("dark", matchMedia(${JSON.stringify(DARK_QUERY)}).matches)`;

/** Applies the appearance to the page and remembers it for the next visits. */
export function applyAppearance(appearance: Appearance): void {
	writePreferenceCookie(APPEARANCE_COOKIE, appearance);
	document.documentElement.classList.toggle(
		"dark",
		isDark(appearance, window.matchMedia(DARK_QUERY).matches),
	);
}
