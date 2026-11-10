import { describe, expect, it } from "vitest";
import { resolveLocale } from "@/lib/locale";

describe("resolveLocale", () => {
	it("defaults to English without a header", () => {
		expect(resolveLocale(undefined)).toBe("en");
		expect(resolveLocale("")).toBe("en");
	});

	it("picks a supported language, ignoring the region", () => {
		expect(resolveLocale("en-GB")).toBe("en");
		expect(resolveLocale("fr-CA")).toBe("fr");
		expect(resolveLocale("es-MX")).toBe("es");
	});

	it("follows the quality order", () => {
		expect(resolveLocale("fr;q=0.5, es;q=0.9")).toBe("es");
		expect(resolveLocale("es;q=0.5, fr")).toBe("fr");
	});

	it("skips unsupported languages", () => {
		expect(resolveLocale("de-DE, es;q=0.8")).toBe("es");
	});

	it("falls back to English when no language is supported", () => {
		expect(resolveLocale("de, it;q=0.8")).toBe("en");
	});

	it("ignores languages refused with q=0", () => {
		expect(resolveLocale("fr;q=0, de")).toBe("en");
	});
});
