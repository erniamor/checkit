import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function Rename() {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger aria-label="Rename the list">✎</TooltipTrigger>
				<TooltipContent>Rename the list</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

describe("Tooltip", () => {
	it("shows its text when the trigger gets the keyboard focus", async () => {
		const user = userEvent.setup();
		render(<Rename />);

		await user.tab();

		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Rename the list",
		);
	});

	it("shows its text on hover, and hides it with Escape", async () => {
		const user = userEvent.setup();
		render(<Rename />);

		await user.hover(screen.getByRole("button", { name: "Rename the list" }));
		expect(await screen.findByRole("tooltip")).toBeInTheDocument();

		await user.keyboard("{Escape}");
		expect(screen.queryByRole("tooltip")).toBeNull();
	});
});
