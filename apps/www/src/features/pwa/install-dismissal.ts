const DISMISSED_KEY = "checkit:install-dismissed-at";
/** How long "Not now" hides the install card on this device. */
export const DISMISSAL_DAYS = 30;

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

function localStorageOrNull(): Storage | null {
	try {
		return window.localStorage;
	} catch {
		// Blocked storage (private browsing, site settings)
		return null;
	}
}

export function isInstallDismissed(
	now = Date.now(),
	storage = localStorageOrNull(),
): boolean {
	try {
		const dismissedAt = Number(storage?.getItem(DISMISSED_KEY));
		return (
			Number.isFinite(dismissedAt) &&
			dismissedAt > 0 &&
			now - dismissedAt < DISMISSAL_DAYS * 24 * 60 * 60 * 1000
		);
	} catch {
		return false;
	}
}

export function dismissInstall(
	now = Date.now(),
	storage = localStorageOrNull(),
): void {
	try {
		storage?.setItem(DISMISSED_KEY, String(now));
	} catch {
		// Not remembered: the card comes back on the next visit
	}
}
