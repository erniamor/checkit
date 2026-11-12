import { useSyncExternalStore } from "react";
import { isIos, isStandalone } from "@/features/pwa/platform";

const subscribe = () => () => {};

/**
 * The app installed on an iPhone or iPad. It has its own cookies, apart from
 * Safari's: a sign-in link from an email would open in Safari, not here.
 */
export function useIsIosApp(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => isIos(window.navigator) && isStandalone(window),
		() => false,
	);
}
