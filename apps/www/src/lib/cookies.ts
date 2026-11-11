const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** Reads a cookie from a `Cookie` header or `document.cookie`. */
export function readCookie(cookies: string, name: string): string | undefined {
	for (const part of cookies.split(";")) {
		const [key, ...value] = part.trim().split("=");
		if (key === name) {
			return decodeURIComponent(value.join("="));
		}
	}
	return undefined;
}

/** Stores a preference in a cookie the server can read on the next request. */
export function writePreferenceCookie(name: string, value: string): void {
	// biome-ignore lint/suspicious/noDocumentCookie: a cookie (not localStorage) lets the server render the preference without a flash
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
}
