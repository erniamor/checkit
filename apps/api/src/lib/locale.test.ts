import { describe, expect, it } from "vitest";
import { resolveLocale } from "@/lib/locale";

describe("resolveLocale", () => {
	it("defaults to French without a header", () => {
		expect(resolveLocale(undefined)).toBe("fr");
		expect(resolveLocale("")).toBe("fr");
	});

	it("picks a supported language, ignoring the region", () => {
		expect(resolveLocale("en-GB")).toBe("en");
		expect(resolveLocale("fr-CA")).toBe("fr");
	});

	it("follows the quality order", () => {
		expect(resolveLocale("fr;q=0.5, en;q=0.9")).toBe("en");
		expect(resolveLocale("en;q=0.5, fr")).toBe("fr");
	});

	it("skips unsupported languages", () => {
		expect(resolveLocale("de-DE, en;q=0.8")).toBe("en");
	});

	it("falls back to French when no language is supported", () => {
		expect(resolveLocale("de, es;q=0.8")).toBe("fr");
	});

	it("ignores languages refused with q=0", () => {
		expect(resolveLocale("en;q=0, de")).toBe("fr");
	});
});
