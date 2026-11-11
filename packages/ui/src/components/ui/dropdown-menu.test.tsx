import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

function SizeMenu({ onChange }: { onChange: (value: string) => void }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger>Size</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>Size</DropdownMenuLabel>
				<DropdownMenuRadioGroup value="small" onValueChange={onChange}>
					<DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

describe("DropdownMenu", () => {
	it("opens from the keyboard and picks a choice", async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(<SizeMenu onChange={onChange} />);

		await user.tab();
		await user.keyboard("{Enter}");

		expect(screen.getByRole("menu")).toBeVisible();
		expect(
			screen.getByRole("menuitemradio", { name: "Small" }),
		).toHaveAttribute("aria-checked", "true");
		await user.click(screen.getByRole("menuitemradio", { name: "Large" }));
		expect(onChange).toHaveBeenCalledWith("large");
		expect(screen.queryByRole("menu")).toBeNull();
	});
});
