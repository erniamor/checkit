import { isIos, isStandalone } from "@/features/pwa/platform";

/** Chromium's event offering to install the app (not in the DOM's types). */
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState =
	/** On the server, or before the page is interactive. */
	| "unknown"
	/** Running as the installed app. */
	| "installed"
	/** The browser can show its install dialog. */
	| "available"
	/** iPhone or iPad: installed by hand, from the Share menu. */
	| "ios"
	/** Not installable in this browser, or not yet. */
	| "unavailable";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let justInstalled = false;
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) {
		listener();
	}
}

/**
 * Keeps the browser's install offer for our own button. Call it once, as early
 * as possible: the event can come before the page is interactive.
 */
export function listenForInstallPrompt(win: Window) {
	win.addEventListener("beforeinstallprompt", (event) => {
		// Our button decides when to offer it, not the browser's mini-infobar
		event.preventDefault();
		deferredPrompt = event as BeforeInstallPromptEvent;
		notify();
	});
	win.addEventListener("appinstalled", () => {
		deferredPrompt = null;
		justInstalled = true;
		notify();
	});
}

export function subscribeToInstallState(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getInstallState(win: Window = window): InstallState {
	if (justInstalled || isStandalone(win)) {
		return "installed";
	}
	if (deferredPrompt) {
		return "available";
	}
	return isIos(win.navigator) ? "ios" : "unavailable";
}

/** Shows the browser's install dialog; resolves to true if the user installs. */
export async function promptInstall(): Promise<boolean> {
	const event = deferredPrompt;
	if (!event) {
		return false;
	}
	// The event can only be used once
	deferredPrompt = null;
	await event.prompt();
	const { outcome } = await event.userChoice;
	notify();
	return outcome === "accepted";
}
