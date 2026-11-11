import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Checkbox", () => {
	it("is checked and unchecked from the keyboard", async () => {
		const onCheckedChange = vi.fn();
		const user = userEvent.setup();
		render(<Checkbox aria-label="Milk" onCheckedChange={onCheckedChange} />);

		const checkbox = screen.getByRole("checkbox", { name: "Milk" });
		await user.tab();
		expect(checkbox).toHaveFocus();
		await user.keyboard(" ");

		expect(checkbox).toBeChecked();
		expect(onCheckedChange).toHaveBeenCalledWith(true);
	});
});
