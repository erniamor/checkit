// Keep in sync with public/sw.js
const OFFLINE_CACHE = "checkit-offline";
export const OFFLINE_PATH = "/offline";

/**
 * Registers the service worker (production only: it would get in the way of
 * the dev server), then keeps the offline page up to date, in the user's
 * language and with the current build's files.
 */
export async function registerServiceWorker(): Promise<void> {
	if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
		return;
	}
	try {
		await navigator.serviceWorker.register("/sw.js");
		const cache = await caches.open(OFFLINE_CACHE);
		await cache.add(OFFLINE_PATH);
	} catch {
		// The app works without it: no offline page, nothing else lost
	}
}
