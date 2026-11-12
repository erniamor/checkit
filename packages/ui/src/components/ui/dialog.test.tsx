import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function Help() {
	return (
		<Dialog>
			<DialogTrigger>How to</DialogTrigger>
			<DialogContent showCloseButton={false}>
				<DialogTitle>Install the app</DialogTitle>
				<DialogDescription>Three steps.</DialogDescription>
				<DialogClose>Got it</DialogClose>
			</DialogContent>
		</Dialog>
	);
}

describe("Dialog", () => {
	it("opens with its title, and closes with its button or Escape", async () => {
		const user = userEvent.setup();
		render(<Help />);

		await user.click(screen.getByRole("button", { name: "How to" }));
		expect(
			screen.getByRole("dialog", { name: "Install the app" }),
		).toHaveAccessibleDescription("Three steps.");
		await user.click(screen.getByRole("button", { name: "Got it" }));
		expect(screen.queryByRole("dialog")).toBeNull();

		await user.click(screen.getByRole("button", { name: "How to" }));
		await user.keyboard("{Escape}");
		expect(screen.queryByRole("dialog")).toBeNull();
	});
});
