import { Button } from "@repo/ui/components/ui/button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Button", () => {
	it("renders a button accessible by its label", () => {
		render(<Button>Book</Button>);
		expect(screen.getByRole("button", { name: "Book" })).toBeInTheDocument();
	});

	it("calls onClick on click and keyboard activation", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Book</Button>);

		await user.keyboard("{Tab}{Enter}");
		await user.click(screen.getByRole("button"));

		expect(onClick).toHaveBeenCalledTimes(2);
	});

	it("does nothing when disabled", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(
			<Button disabled onClick={onClick}>
				Book
			</Button>,
		);

		await user.click(screen.getByRole("button"));

		expect(screen.getByRole("button")).toBeDisabled();
		expect(onClick).not.toHaveBeenCalled();
	});

	it("renders the child element with asChild", () => {
		render(
			<Button asChild>
				<a href="/en/about">About us</a>
			</Button>,
		);

		const link = screen.getByRole("link", { name: "About us" });
		expect(link).toHaveAttribute("href", "/en/about");
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
