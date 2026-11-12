/** Opened from the home screen or as an installed app, not in a browser tab. */
export function isStandalone(win: Window): boolean {
	return (
		// Optional: some environments (jsdom) have no matchMedia
		win.matchMedia?.("(display-mode: standalone)").matches === true ||
		// Safari on iOS doesn't support the media query in older versions
		(win.navigator as Navigator & { standalone?: boolean }).standalone === true
	);
}

/** iPhone or iPad, where installing only goes through the Share menu. */
export function isIos(
	navigator: Pick<Navigator, "userAgent" | "maxTouchPoints">,
) {
	return (
		/iPhone|iPad|iPod/.test(navigator.userAgent) ||
		// iPadOS presents itself as a Mac, but a Mac has no touch screen
		(/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
	);
}
