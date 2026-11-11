import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

describe("Input and Label", () => {
	it("are associated, so the field is found by its label", async () => {
		const user = userEvent.setup();
		render(
			<>
				<Label htmlFor="email">Email</Label>
				<Input id="email" type="email" />
			</>,
		);

		const field = screen.getByLabelText("Email");
		await user.type(field, "alice@example.com");

		expect(field).toHaveValue("alice@example.com");
	});

	it("exposes an invalid state to assistive technologies", () => {
		render(<Input aria-label="Name" aria-invalid />);

		expect(screen.getByRole("textbox", { name: "Name" })).toBeInvalid();
	});
});
