import { Toaster } from "@repo/ui";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { aliceProfile, mockApi } from "@/test/mock-api";
import { renderWithRouter } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

describe("ProfilePage", () => {
	it("shows the email and changes the name", async () => {
		const requests = mockApi(({ body }) => ({
			status: 200,
			body: { ...aliceProfile, ...(body as object) },
		}));
		const user = userEvent.setup();
		renderWithRouter(
			<>
				<ProfilePage me={aliceProfile} />
				<Toaster />
			</>,
		);

		expect(await screen.findByText("alice@example.com")).toBeVisible();
		const name = screen.getByLabelText("Your name");
		expect(name).toHaveValue("Alice");
		await user.clear(name);
		await user.type(name, "Alice Martin");
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByText("Your name was saved.")).toBeVisible();
		expect(requests).toEqual([
			{ method: "PATCH", path: "/me", body: { name: "Alice Martin" } },
		]);
	});

	it("refuses an empty name", async () => {
		const requests = mockApi(() => ({ status: 200, body: aliceProfile }));
		const user = userEvent.setup();
		renderWithRouter(<ProfilePage me={aliceProfile} />);

		await user.clear(await screen.findByLabelText("Your name"));
		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByText("Enter your name.")).toBeVisible();
		expect(requests).toEqual([]);
	});
});
