import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
	APPEARANCE_COOKIE,
	parseAppearance,
} from "@/features/appearance/appearance";
import { readCookie } from "@/lib/cookies";

/**
 * The user's appearance, read from its cookie: from the request on the server,
 * from `document.cookie` in the browser. The server implementation is removed
 * from the client bundle.
 */
export const getAppearance = createIsomorphicFn()
	.server(() => parseAppearance(getCookie(APPEARANCE_COOKIE)))
	.client(() =>
		parseAppearance(readCookie(document.cookie, APPEARANCE_COOKIE)),
	);
