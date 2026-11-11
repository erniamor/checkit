import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppearanceMenu } from "@/features/appearance/AppearanceMenu";
import { readCookie } from "@/lib/cookies";
import { setTestLocale } from "@/test/locale";
import { mockSystemAppearance } from "@/test/match-media";

afterEach(() => {
	vi.unstubAllGlobals();
	document.documentElement.classList.remove("dark");
	delete document.documentElement.dataset.theme;
});

describe("AppearanceMenu", () => {
	it("offers the modes and the themes", async () => {
		setTestLocale("fr");
		const user = userEvent.setup();
		render(<AppearanceMenu initialAppearance="system" initialTheme="garden" />);

		await user.click(
			screen.getByRole("button", { name: "Apparence : Système, Potager" }),
		);

		const modes = screen.getByRole("group", { name: "Mode" });
		expect(
			within(modes)
				.getAllByRole("menuitemradio")
				.map((item) => item.textContent),
		).toEqual(["Claire", "Sombre", "Système"]);
		const themes = screen.getByRole("group", { name: "Thème" });
		expect(
			within(themes)
				.getAllByRole("menuitemradio")
				.map((item) => item.textContent),
		).toEqual(["Papeterie", "Synthwave", "Potager", "Brutaliste", "Neutre"]);
		expect(
			within(themes).getByRole("menuitemradio", { name: "Potager" }),
		).toHaveAttribute("aria-checked", "true");
	});

	it("applies a theme at once and remembers it, keeping the mode", async () => {
		mockSystemAppearance(false);
		const user = userEvent.setup();
		render(
			<AppearanceMenu initialAppearance="dark" initialTheme="stationery" />,
		);

		await user.click(
			screen.getByRole("button", { name: "Appearance: Dark, Stationery" }),
		);
		await user.click(screen.getByRole("menuitemradio", { name: "Synthwave" }));

		expect(document.documentElement.dataset.theme).toBe("synthwave");
		expect(readCookie(document.cookie, "theme")).toBe("synthwave");
		expect(
			screen.getByRole("button", { name: "Appearance: Dark, Synthwave" }),
		).toBeInTheDocument();
	});
});
