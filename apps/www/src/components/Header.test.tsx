import type { Profile } from "@repo/schemas";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/Header";
import { readCookie } from "@/lib/cookies";
import { setTestLocale } from "@/test/locale";
import { mockSystemAppearance } from "@/test/match-media";
import { aliceProfile, mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

afterEach(() => {
	vi.unstubAllGlobals();
	document.documentElement.classList.remove("dark");
});

async function renderHeader(me: Profile | null = null) {
	renderWithRouter(<Header appearance="system" me={me} />);
	return screen.findByRole("banner");
}

describe("Header", () => {
	it("offers a visitor to sign in", async () => {
		const header = await renderHeader();

		expect(
			within(header).getByRole("link", { name: "Sign in" }),
		).toHaveAttribute("href", "/sign-in");
	});

	it("shows the signed-in user, who can sign out", async () => {
		const requests = mockApi(() => ({ status: 200, body: { success: true } }));
		const user = userEvent.setup();
		const header = await renderHeader(aliceProfile);

		expect(within(header).getByText("Signed in as Alice")).toBeInTheDocument();
		await user.click(within(header).getByRole("button", { name: "Sign out" }));

		await vi.waitFor(() =>
			expect(requests).toEqual([
				{ method: "POST", path: "/auth/sign-out", body: {} },
			]),
		);
	});

	it("shows the logo linking to the home page", async () => {
		const header = await renderHeader();

		expect(
			within(header).getByRole("link", { name: "Checkit, home" }),
		).toHaveAttribute("href", "/");
	});

	it.each([
		["en", "Language", "Appearance", "System"],
		["fr", "Langue", "Apparence", "Système"],
		["es", "Idioma", "Apariencia", "Sistema"],
	] as const)(
		"is translated in %s",
		async (locale, language, appearance, system) => {
			setTestLocale(locale);

			const header = await renderHeader();

			expect(
				within(header).getByRole("combobox", { name: language }),
			).toHaveValue(locale);
			const appearanceSelect = within(header).getByRole("combobox", {
				name: appearance,
			});
			expect(
				within(appearanceSelect).getByRole("option", { name: system }),
			).toHaveProperty("selected", true);
		},
	);

	it("names each language in itself", async () => {
		setTestLocale("fr");
		const header = await renderHeader();

		const languages = within(
			within(header).getByRole("combobox", { name: "Langue" }),
		).getAllByRole("option");

		expect(languages.map((option) => option.textContent)).toEqual([
			"English",
			"Français",
			"Español",
		]);
	});

	it("switches to dark mode from the keyboard", async () => {
		mockSystemAppearance(false);
		const user = userEvent.setup();
		const header = await renderHeader();
		const select = within(header).getByRole("combobox", {
			name: "Appearance",
		});

		await user.tab();
		await user.tab();
		await user.tab();
		expect(select).toHaveFocus();
		await user.selectOptions(select, "Dark");

		expect(select).toHaveValue("dark");
		expect(document.documentElement).toHaveClass("dark");
		expect(readCookie(document.cookie, "appearance")).toBe("dark");
	});
});
