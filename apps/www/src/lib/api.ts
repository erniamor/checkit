import { type Api, createApi } from "@repo/resources";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getPublicEnv } from "@/env";
import { getLocale } from "@/paraglide/runtime";
import { getServerApiUrl } from "@/server/env";

let browserApi: Api | undefined;

/**
 * The API's resources. In the browser, requests carry the session cookie
 * (`credentials: "include"`). During server rendering, the cookie of the
 * incoming request is forwarded. Both send the app's language, used by the
 * API for its emails.
 */
export const getApi = createIsomorphicFn()
	.server(() =>
		createApi({
			baseUrl: getServerApiUrl(),
			headers: () => ({
				Cookie: getRequestHeader("cookie"),
				"Accept-Language": getLocale(),
			}),
		}),
	)
	.client(() => {
		browserApi ??= createApi({
			baseUrl: getPublicEnv().VITE_API_URL,
			credentials: "include",
			headers: () => ({ "Accept-Language": getLocale() }),
		});
		return browserApi;
	});
