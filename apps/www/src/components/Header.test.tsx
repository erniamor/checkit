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

	it("shows the signed-in user's menu, with the profile and sign-out", async () => {
		const requests = mockApi(() => ({ status: 200, body: { success: true } }));
		const user = userEvent.setup();
		const header = await renderHeader(aliceProfile);

		await user.click(
			within(header).getByRole("button", { name: "Account: Alice" }),
		);
		const menu = screen.getByRole("menu");
		expect(within(menu).getByText("Alice")).toBeVisible();
		expect(within(menu).getByText("alice@example.com")).toBeVisible();
		expect(
			within(menu).getByRole("menuitem", { name: "Profile" }),
		).toHaveAttribute("href", "/profile");

		await user.click(within(menu).getByRole("menuitem", { name: "Sign out" }));

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
		["en", "Language: English", "Appearance: System"],
		["fr", "Langue : Français", "Apparence : Système"],
		["es", "Idioma: Español", "Apariencia: Sistema"],
	] as const)(
		"names its menus with their current choice, in %s",
		async (locale, language, appearance) => {
			setTestLocale(locale);

			const header = await renderHeader();

			expect(
				within(header).getByRole("button", { name: language }),
			).toHaveAttribute("aria-haspopup", "menu");
			expect(
				within(header).getByRole("button", { name: appearance }),
			).toHaveAttribute("aria-haspopup", "menu");
		},
	);

	it("switches to dark mode from the keyboard", async () => {
		mockSystemAppearance(false);
		const user = userEvent.setup();
		const header = await renderHeader();
		const trigger = within(header).getByRole("button", {
			name: "Appearance: System",
		});

		await user.tab();
		await user.tab();
		await user.tab();
		expect(trigger).toHaveFocus();
		await user.keyboard("{Enter}");
		expect(
			screen.getByRole("menuitemradio", { name: "System" }),
		).toHaveAttribute("aria-checked", "true");
		await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));

		expect(document.documentElement).toHaveClass("dark");
		expect(readCookie(document.cookie, "appearance")).toBe("dark");
		expect(
			within(header).getByRole("button", { name: "Appearance: Dark" }),
		).toHaveFocus();
	});
});
