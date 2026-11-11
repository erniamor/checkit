import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * The app's origin ("https://checkit.example.com"), to build links to share.
 * Empty during server rendering, filled once the page runs in the browser.
 */
export function useOrigin(): string {
	return useSyncExternalStore(
		noSubscription,
		() => window.location.origin,
		() => "",
	);
}
