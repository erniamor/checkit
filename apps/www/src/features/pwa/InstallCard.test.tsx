import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InstallCard } from "@/features/pwa/InstallCard";
import type { InstallState } from "@/features/pwa/install-prompt";
import { useInstall } from "@/features/pwa/use-install";
import { renderWithQueryClient } from "@/test/render-with-router";

vi.mock("@/features/pwa/use-install", () => ({ useInstall: vi.fn() }));

function mockInstall(state: InstallState, dismissed = false) {
	const install = vi.fn(async () => true);
	const dismiss = vi.fn();
	vi.mocked(useInstall).mockReturnValue({
		state,
		installable: state === "available" || state === "ios",
		dismissed,
		install,
		dismiss,
	});
	return { install, dismiss };
}

function renderCard() {
	renderWithQueryClient(<InstallCard />);
	return userEvent.setup();
}

describe("InstallCard", () => {
	it("opens the browser's install dialog", async () => {
		const { install } = mockInstall("available");
		const user = renderCard();

		await user.click(screen.getByRole("button", { name: "Install" }));

		expect(install).toHaveBeenCalledOnce();
	});

	it("explains how to install on an iPhone, and the new sign-in", async () => {
		mockInstall("ios");
		const user = renderCard();

		await user.click(screen.getByRole("button", { name: "Show me how" }));

		const dialog = screen.getByRole("dialog", {
			name: "Add Checkit to your home screen",
		});
		expect(dialog).toHaveTextContent("Tap the Share button");
		expect(dialog).toHaveTextContent("Add to Home Screen");
		expect(dialog).toHaveTextContent("with a code we email you");
		await user.click(screen.getByRole("button", { name: "Got it" }));
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("can be put off", async () => {
		const { dismiss } = mockInstall("available");
		const user = renderCard();

		await user.click(screen.getByRole("button", { name: "Not now" }));

		expect(dismiss).toHaveBeenCalledOnce();
	});

	it.each([
		["installed", false],
		["unavailable", false],
		["unknown", false],
		["available", true],
	] as const)("shows nothing when %s (dismissed: %s)", (state, dismissed) => {
		mockInstall(state, dismissed);
		renderCard();

		expect(
			screen.queryByRole("region", { name: "Install Checkit" }),
		).toBeNull();
	});
});
