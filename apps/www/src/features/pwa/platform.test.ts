import { describe, expect, it } from "vitest";
import { isIos, isStandalone } from "@/features/pwa/platform";

const iphone =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const mac =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const android =
	"Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

describe("isIos", () => {
	it("recognizes an iPhone, and an iPad presenting itself as a Mac", () => {
		expect(isIos({ userAgent: iphone, maxTouchPoints: 5 })).toBe(true);
		expect(isIos({ userAgent: mac, maxTouchPoints: 5 })).toBe(true);
	});

	it("doesn't take a Mac or an Android phone for iOS", () => {
		expect(isIos({ userAgent: mac, maxTouchPoints: 0 })).toBe(false);
		expect(isIos({ userAgent: android, maxTouchPoints: 5 })).toBe(false);
	});
});

describe("isStandalone", () => {
	function fakeWindow(displayStandalone: boolean, iosStandalone?: boolean) {
		return {
			matchMedia: (query: string) => ({
				matches: query === "(display-mode: standalone)" && displayStandalone,
			}),
			navigator: { standalone: iosStandalone },
		} as unknown as Window;
	}

	it("recognizes the installed app, in every browser", () => {
		expect(isStandalone(fakeWindow(true))).toBe(true);
		expect(isStandalone(fakeWindow(false, true))).toBe(true);
	});

	it("is false in a browser tab", () => {
		expect(isStandalone(fakeWindow(false, false))).toBe(false);
	});
});
