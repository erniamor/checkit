import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignInPage } from "@/features/auth/SignInPage";
import { mockApi } from "@/test/mock-api";
import { renderWithQueryClient } from "@/test/render-with-router";

vi.mock("@/lib/api", () => ({ getApi: vi.fn() }));

function renderSignIn(onSignedIn = vi.fn()) {
	renderWithQueryClient(
		<SignInPage redirect="/lists" onSignedIn={onSignedIn} />,
	);
	return { onSignedIn, user: userEvent.setup() };
}

async function submitEmail(
	user: ReturnType<typeof userEvent.setup>,
	email: string,
) {
	await user.type(screen.getByLabelText("Email"), email);
	await user.click(screen.getByRole("button", { name: "Send me a link" }));
}

describe("SignInPage", () => {
	it("prefills the email, e.g. with the address of an invitation", () => {
		renderWithQueryClient(
			<SignInPage
				redirect="/invitations/tok"
				defaultEmail="bob@example.com"
				onSignedIn={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText("Email")).toHaveValue("bob@example.com");
	});

	it("emails a link that brings the user back to the requested page", async () => {
		const requests = mockApi(() => ({ status: 200, body: { status: true } }));
		const { user } = renderSignIn();

		await submitEmail(user, "Alice@Example.com");

		expect(
			await screen.findByRole("heading", { name: "Check your email" }),
		).toBeVisible();
		expect(screen.getByText(/Alice@Example\.com/)).toBeVisible();
		expect(requests).toEqual([
			{
				method: "POST",
				path: "/auth/sign-in/magic-link",
				body: {
					email: "alice@example.com",
					callbackURL: `${window.location.origin}/lists`,
				},
			},
		]);
	});

	it("shows an invalid email next to the field, without calling the API", async () => {
		const requests = mockApi(() => ({ status: 200, body: {} }));
		const { user } = renderSignIn();

		await submitEmail(user, "not-an-email");

		expect(
			await screen.findByText("Enter a valid email address."),
		).toBeVisible();
		expect(screen.getByLabelText("Email")).toBeInvalid();
		expect(requests).toEqual([]);
	});

	it("signs in with a code as a fallback", async () => {
		const requests = mockApi(({ path, body }) => {
			if (path === "/auth/sign-in/email-otp") {
				return (body as { otp: string }).otp === "123456"
					? { status: 200, body: { token: "t" } }
					: {
							status: 400,
							body: { code: "INVALID_OTP", message: "Invalid OTP" },
						};
			}
			return { status: 200, body: { status: true } };
		});
		const { user, onSignedIn } = renderSignIn();
		await submitEmail(user, "alice@example.com");

		await user.click(
			await screen.findByRole("button", { name: "Get a code instead" }),
		);
		const code = await screen.findByLabelText("Sign-in code");
		await user.type(code, "000000");
		await user.click(screen.getByRole("button", { name: "Sign in" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"This code is wrong. Check the latest email we sent.",
		);
		expect(onSignedIn).not.toHaveBeenCalled();

		await user.clear(code);
		await user.type(code, "123456");
		await user.click(screen.getByRole("button", { name: "Sign in" }));

		await vi.waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce());
		expect(requests.map((request) => request.path)).toEqual([
			"/auth/sign-in/magic-link",
			"/auth/email-otp/send-verification-otp",
			"/auth/sign-in/email-otp",
			"/auth/sign-in/email-otp",
		]);
	});

	it("starts over with another email", async () => {
		mockApi(() => ({ status: 200, body: { status: true } }));
		const { user } = renderSignIn();
		await submitEmail(user, "alice@example.com");

		await user.click(
			await screen.findByRole("button", { name: "Use another email" }),
		);

		expect(screen.getByLabelText("Email")).toHaveValue("");
	});

	it("explains a rate limit", async () => {
		mockApi(() => ({ status: 429, body: { message: "Too many requests" } }));
		const { user } = renderSignIn();

		await submitEmail(user, "alice@example.com");

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Too many attempts. Wait a minute and try again.",
		);
	});
});
