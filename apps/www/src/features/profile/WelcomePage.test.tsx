import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WelcomePage } from "@/features/profile/WelcomePage";
import { aliceProfile, mockApi } from "@/test/mock-api";
import { renderWithQueryClient } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

describe("WelcomePage", () => {
	it("saves the name, then continues", async () => {
		const requests = mockApi(() => ({ status: 200, body: aliceProfile }));
		const onSaved = vi.fn();
		const user = userEvent.setup();
		renderWithQueryClient(<WelcomePage onSaved={onSaved} />);

		await user.type(screen.getByLabelText("Your name"), "  Alice ");
		await user.click(screen.getByRole("button", { name: "Continue" }));

		await vi.waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
		expect(requests).toEqual([
			{ method: "PATCH", path: "/me", body: { name: "Alice" } },
		]);
	});

	it("asks for a name before calling the API", async () => {
		const requests = mockApi(() => ({ status: 200, body: aliceProfile }));
		const user = userEvent.setup();
		renderWithQueryClient(<WelcomePage onSaved={vi.fn()} />);

		await user.click(screen.getByRole("button", { name: "Continue" }));

		expect(await screen.findByText("Enter your name.")).toBeVisible();
		expect(requests).toEqual([]);
	});

	it("shows the API's validation errors next to the field", async () => {
		mockApi(() => ({
			status: 422,
			body: {
				error: {
					code: "validation_error",
					message: "Invalid request",
					details: [{ field: "name", message: "name_too_long" }],
				},
			},
		}));
		const user = userEvent.setup();
		renderWithQueryClient(<WelcomePage onSaved={vi.fn()} />);

		await user.type(screen.getByLabelText("Your name"), "Alice");
		await user.click(screen.getByRole("button", { name: "Continue" }));

		expect(
			await screen.findByText("Your name is too long (60 characters at most)."),
		).toBeVisible();
	});
});
