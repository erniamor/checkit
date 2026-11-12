// Checkit's service worker. It makes the app installable, keeps the build's
// files (hashed names, never changed) for faster loads, and shows the offline
// page when a page can't load. Pages and data (the API) are never cached:
// what's shown is always up to date.
const ASSETS_CACHE = "checkit-assets";
// Filled by the page itself (src/features/pwa/service-worker.ts)
const OFFLINE_CACHE = "checkit-offline";
const OFFLINE_PATH = "/offline";
const MAX_ASSETS = 200;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (request.method !== "GET" || url.origin !== self.location.origin) {
		return;
	}
	if (request.mode === "navigate") {
		event.respondWith(fetch(request).catch(() => offline(url)));
	} else if (url.pathname.startsWith("/assets/")) {
		event.respondWith(cacheFirst(request));
	}
});

/**
 * Sends the browser to the offline page, which remembers the page asked for:
 * served at its own address, it starts as itself once interactive.
 */
async function offline(url) {
	const page = await caches.match(OFFLINE_PATH, { cacheName: OFFLINE_CACHE });
	if (!page) {
		return Response.error();
	}
	if (url.pathname === OFFLINE_PATH) {
		return page;
	}
	const from = encodeURIComponent(url.pathname + url.search);
	return Response.redirect(`${OFFLINE_PATH}?from=${from}`, 302);
}

async function cacheFirst(request) {
	const cache = await caches.open(ASSETS_CACHE);
	const cached = await cache.match(request);
	if (cached) {
		return cached;
	}
	const response = await fetch(request);
	if (response.ok) {
		await cache.put(request, response.clone());
		await trim(cache);
	}
	return response;
}

/** Drops the oldest files, left by previous builds. */
async function trim(cache) {
	const keys = await cache.keys();
	for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) {
		await cache.delete(key);
	}
}
