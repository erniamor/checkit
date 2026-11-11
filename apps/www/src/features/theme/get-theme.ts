import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { parseTheme, THEME_COOKIE } from "@/features/theme/theme";
import { readCookie } from "@/lib/cookies";

/**
 * The previewed theme, read from its cookie: from the request on the server,
 * from `document.cookie` in the browser.
 */
export const getTheme = createIsomorphicFn()
	.server(() => parseTheme(getCookie(THEME_COOKIE)))
	.client(() => parseTheme(readCookie(document.cookie, THEME_COOKIE)));
