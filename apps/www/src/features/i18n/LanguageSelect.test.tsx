import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageSelect } from "@/features/i18n/LanguageSelect";

describe("LanguageSelect", () => {
	it("reports the chosen language", async () => {
		const onLocaleChange = vi.fn();
		const user = userEvent.setup();
		render(<LanguageSelect locale="en" onLocaleChange={onLocaleChange} />);

		await user.selectOptions(
			screen.getByRole("combobox", { name: "Language" }),
			"Español",
		);

		expect(onLocaleChange).toHaveBeenCalledWith("es");
	});
});
