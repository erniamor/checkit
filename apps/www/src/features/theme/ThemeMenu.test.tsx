import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeMenu } from "@/features/theme/ThemeMenu";
import { parseTheme } from "@/features/theme/theme";
import { readCookie } from "@/lib/cookies";
import { setTestLocale } from "@/test/locale";

afterEach(() => {
	delete document.documentElement.dataset.theme;
});

describe("ThemeMenu", () => {
	it("previews a theme at once and remembers it", async () => {
		setTestLocale("fr");
		const user = userEvent.setup();
		render(<ThemeMenu initialTheme="brand" />);

		await user.click(screen.getByRole("button", { name: "Thème : Actuel" }));
		expect(
			screen.getAllByRole("menuitemradio").map((item) => item.textContent),
		).toEqual([
			"Actuel",
			"Neutre",
			"A · Papeterie",
			"B · Synthwave",
			"C · Potager",
			"D · Agrumes",
			"E · Brutaliste",
		]);
		await user.click(
			screen.getByRole("menuitemradio", { name: "C · Potager" }),
		);

		expect(document.documentElement.dataset.theme).toBe("variant-c");
		expect(readCookie(document.cookie, "theme")).toBe("variant-c");
		expect(
			screen.getByRole("button", { name: "Thème : C · Potager" }),
		).toBeInTheDocument();
	});
});

describe("parseTheme", () => {
	it("keeps a known theme and falls back to the default one", () => {
		expect(parseTheme("variant-e")).toBe("variant-e");
		expect(parseTheme("unknown")).toBe("brand");
		expect(parseTheme(undefined)).toBe("brand");
	});
});
