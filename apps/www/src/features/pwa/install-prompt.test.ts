import { beforeEach, describe, expect, it, vi } from "vitest";

const desktop =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** A browser window that can send the install events. */
function fakeWindow() {
	const target = new EventTarget();
	return Object.assign(target, {
		matchMedia: () => ({ matches: false }),
		navigator: { userAgent: desktop, maxTouchPoints: 0 },
	}) as unknown as Window;
}

function installOffer(outcome: "accepted" | "dismissed") {
	const event = new Event("beforeinstallprompt", { cancelable: true });
	return Object.assign(event, {
		prompt: vi.fn(async () => {}),
		userChoice: Promise.resolve({ outcome }),
	});
}

// The offer is kept by the module: a fresh one for each test
async function load() {
	vi.resetModules();
	return import("@/features/pwa/install-prompt");
}

describe("install prompt", () => {
	let win: Window;

	beforeEach(() => {
		win = fakeWindow();
	});

	it("keeps the browser's offer for our button, and uses it once", async () => {
		const { listenForInstallPrompt, getInstallState, promptInstall } =
			await load();
		listenForInstallPrompt(win);
		expect(getInstallState(win)).toBe("unavailable");

		const offer = installOffer("accepted");
		win.dispatchEvent(offer);

		expect(offer.defaultPrevented).toBe(true);
		expect(getInstallState(win)).toBe("available");
		expect(await promptInstall()).toBe(true);
		expect(offer.prompt).toHaveBeenCalledOnce();
		expect(getInstallState(win)).toBe("unavailable");
	});

	it("knows when the app was just installed", async () => {
		const { listenForInstallPrompt, getInstallState, subscribeToInstallState } =
			await load();
		listenForInstallPrompt(win);
		const listener = vi.fn();
		subscribeToInstallState(listener);

		win.dispatchEvent(new Event("appinstalled"));

		expect(listener).toHaveBeenCalled();
		expect(getInstallState(win)).toBe("installed");
	});

	it("does nothing without an offer", async () => {
		const { promptInstall } = await load();

		expect(await promptInstall()).toBe(false);
	});
});
