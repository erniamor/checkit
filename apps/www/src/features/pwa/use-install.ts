import { useState, useSyncExternalStore } from "react";
import {
	dismissInstall,
	isInstallDismissed,
} from "@/features/pwa/install-dismissal";
import {
	getInstallState,
	promptInstall,
	subscribeToInstallState,
} from "@/features/pwa/install-prompt";

/**
 * Whether and how the app can be installed on this device. "unknown" during
 * server rendering and hydration: the install offers only show in the browser.
 */
export function useInstall() {
	const state = useSyncExternalStore(
		subscribeToInstallState,
		() => getInstallState(),
		() => "unknown" as const,
	);
	const [dismissed, setDismissed] = useState(() =>
		typeof window === "undefined" ? false : isInstallDismissed(),
	);

	return {
		state,
		/** The app can be installed: by the browser's dialog, or by hand on iOS. */
		installable: state === "available" || state === "ios",
		dismissed,
		install: promptInstall,
		dismiss() {
			dismissInstall();
			setDismissed(true);
		},
	};
}
