import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@repo/ui/components/ui/alert-dialog";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

function ConfirmDelete({ onConfirm }: { onConfirm: () => void }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger>Delete</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete the list?</AlertDialogTitle>
					<AlertDialogDescription>This can't be undone.</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

describe("AlertDialog", () => {
	it("asks for confirmation in a labelled dialog", async () => {
		const onConfirm = vi.fn();
		const user = userEvent.setup();
		render(<ConfirmDelete onConfirm={onConfirm} />);

		await user.click(screen.getByRole("button", { name: "Delete" }));

		expect(
			screen.getByRole("alertdialog", { name: "Delete the list?" }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Confirm" }));
		expect(onConfirm).toHaveBeenCalledOnce();
	});

	it("closes with Escape, without confirming", async () => {
		const onConfirm = vi.fn();
		const user = userEvent.setup();
		render(<ConfirmDelete onConfirm={onConfirm} />);

		await user.click(screen.getByRole("button", { name: "Delete" }));
		await user.keyboard("{Escape}");

		expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
		expect(onConfirm).not.toHaveBeenCalled();
	});
});
