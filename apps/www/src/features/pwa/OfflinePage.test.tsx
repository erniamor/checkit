import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OfflinePage } from "@/features/pwa/OfflinePage";
import { renderWithQueryClient } from "@/test/render-with-router";

describe("OfflinePage", () => {
	it("says the app is offline, and retries on demand or once back online", async () => {
		const onRetry = vi.fn();
		renderWithQueryClient(<OfflinePage onRetry={onRetry} />);

		expect(
			screen.getByRole("heading", { name: "You're offline" }),
		).toBeVisible();
		await userEvent
			.setup()
			.click(screen.getByRole("button", { name: "Try again" }));
		window.dispatchEvent(new Event("online"));

		expect(onRetry).toHaveBeenCalledTimes(2);
	});
});
