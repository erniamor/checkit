import { describe, expect, it } from "vitest";
import { recognitionLanguage } from "@/features/voice/recognition-language";

describe("recognitionLanguage", () => {
	it("uses the browser's regional variant of the app's language", () => {
		expect(recognitionLanguage("fr", ["en-CA", "fr-CA", "fr"])).toBe("fr-CA");
	});

	it("falls back to a default region when the browser has none", () => {
		expect(recognitionLanguage("fr", ["fr", "en-US"])).toBe("fr-FR");
		expect(recognitionLanguage("es", [])).toBe("es-ES");
		expect(recognitionLanguage("en", ["fr-FR"])).toBe("en-US");
	});
});
