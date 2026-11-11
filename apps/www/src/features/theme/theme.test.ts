import { describe, expect, it } from "vitest";
import { parseTheme } from "@/features/theme/theme";

describe("parseTheme", () => {
	it("keeps an offered theme", () => {
		expect(parseTheme("brutalist")).toBe("brutalist");
	});

	it("falls back to the default theme for a missing or no longer offered one", () => {
		expect(parseTheme(undefined)).toBe("stationery");
		expect(parseTheme("brand")).toBe("stationery");
		expect(parseTheme("variant-a")).toBe("stationery");
	});
});
