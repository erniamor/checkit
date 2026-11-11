import { Toaster } from "@repo/ui/components/ui/sonner";
import { act, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it } from "vitest";

describe("Toaster", () => {
	it("shows the toasts, announced to screen readers", async () => {
		render(<Toaster theme="dark" />);

		act(() => {
			toast.info("This list was deleted");
		});

		expect(await screen.findByText("This list was deleted")).toBeVisible();
		expect(
			screen.getByRole("region", { name: /Notifications/ }),
		).toHaveAttribute("aria-live", "polite");
	});
});
