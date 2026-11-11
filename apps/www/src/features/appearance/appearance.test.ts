import { afterEach, describe, expect, it, vi } from "vitest";
import {
	applyAppearance,
	isDark,
	parseAppearance,
	serverHtmlClass,
} from "@/features/appearance/appearance";
import { readCookie } from "@/lib/cookies";
import { mockSystemAppearance } from "@/test/match-media";

afterEach(() => {
	vi.unstubAllGlobals();
	document.documentElement.classList.remove("dark");
});

describe("parseAppearance", () => {
	it("accepts the known appearances", () => {
		expect(parseAppearance("light")).toBe("light");
		expect(parseAppearance("dark")).toBe("dark");
		expect(parseAppearance("system")).toBe("system");
	});

	it("falls back to the system's appearance", () => {
		expect(parseAppearance(undefined)).toBe("system");
		expect(parseAppearance("purple")).toBe("system");
	});
});

describe("isDark", () => {
	it("follows the choice, or the system when the choice is system", () => {
		expect(isDark("dark", false)).toBe(true);
		expect(isDark("light", true)).toBe(false);
		expect(isDark("system", true)).toBe(true);
		expect(isDark("system", false)).toBe(false);
	});
});

describe("serverHtmlClass", () => {
	it("only renders the dark class for the dark choice", () => {
		expect(serverHtmlClass("dark")).toBe("dark");
		expect(serverHtmlClass("light")).toBeUndefined();
		expect(serverHtmlClass("system")).toBeUndefined();
	});
});

describe("applyAppearance", () => {
	it("updates the page and remembers the choice in a cookie", () => {
		mockSystemAppearance(false);

		applyAppearance("dark");
		expect(document.documentElement).toHaveClass("dark");
		expect(readCookie(document.cookie, "appearance")).toBe("dark");

		applyAppearance("light");
		expect(document.documentElement).not.toHaveClass("dark");
		expect(readCookie(document.cookie, "appearance")).toBe("light");
	});

	it("follows the system for the system choice", () => {
		mockSystemAppearance(true);

		applyAppearance("system");

		expect(document.documentElement).toHaveClass("dark");
	});
});
