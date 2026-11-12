import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function Notifications() {
	return (
		<Popover>
			<PopoverTrigger>Notifications</PopoverTrigger>
			<PopoverContent aria-label="Notifications">
				<button type="button">Accept</button>
			</PopoverContent>
		</Popover>
	);
}

describe("Popover", () => {
	it("opens on click, with its buttons usable, and closes with Escape", async () => {
		const user = userEvent.setup();
		render(<Notifications />);

		await user.click(screen.getByRole("button", { name: "Notifications" }));
		expect(
			await screen.findByRole("dialog", { name: "Notifications" }),
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Accept" })).toBeVisible();

		await user.keyboard("{Escape}");
		expect(screen.queryByRole("dialog")).toBeNull();
	});
});
