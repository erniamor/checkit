import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageMenu } from "@/features/i18n/LanguageMenu";

describe("LanguageMenu", () => {
	it("lists each language in itself and reports the chosen one", async () => {
		const onLocaleChange = vi.fn();
		const user = userEvent.setup();
		render(<LanguageMenu locale="fr" onLocaleChange={onLocaleChange} />);

		await user.click(
			screen.getByRole("button", { name: "Language: Français" }),
		);

		expect(
			screen.getAllByRole("menuitemradio").map((item) => item.textContent),
		).toEqual(["English", "Français", "Español"]);
		expect(
			screen.getByRole("menuitemradio", { name: "Français" }),
		).toHaveAttribute("aria-checked", "true");
		await user.click(screen.getByRole("menuitemradio", { name: "Español" }));
		expect(onLocaleChange).toHaveBeenCalledWith("es");
	});

	it("does nothing when the current language is chosen again", async () => {
		const onLocaleChange = vi.fn();
		const user = userEvent.setup();
		render(<LanguageMenu locale="en" onLocaleChange={onLocaleChange} />);

		await user.click(screen.getByRole("button", { name: "Language: English" }));
		await user.click(screen.getByRole("menuitemradio", { name: "English" }));

		expect(onLocaleChange).not.toHaveBeenCalled();
	});
});
