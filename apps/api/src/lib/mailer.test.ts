import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { createResendMailer, type EmailMessage } from "@/lib/mailer";

const message: EmailMessage = {
	to: "alice@example.com",
	subject: "Your Checkit sign-in code: 123456",
	text: "Your Checkit sign-in code is: 123456",
};

function mailerAnswering(respond: () => Promise<Response>) {
	const fetch = vi.fn<typeof globalThis.fetch>(respond);
	const mailer = createResendMailer({
		apiKey: "re_test_key",
		from: "Checkit <hello@checkit.example.com>",
		fetch,
	});
	return { mailer, fetch };
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("createResendMailer", () => {
	it("sends the email through Resend's API", async () => {
		const { mailer, fetch } = mailerAnswering(async () =>
			Response.json({ id: "email-id" }),
		);

		await mailer.send(message);

		expect(fetch).toHaveBeenCalledOnce();
		const [url, init] = fetch.mock.calls[0] ?? [];
		expect(url).toBe("https://api.resend.com/emails");
		expect(init?.method).toBe("POST");
		expect(init?.headers).toMatchObject({
			Authorization: "Bearer re_test_key",
			"Content-Type": "application/json",
		});
		expect(JSON.parse(String(init?.body))).toEqual({
			from: "Checkit <hello@checkit.example.com>",
			to: ["alice@example.com"],
			subject: message.subject,
			text: message.text,
		});
		expect(init?.signal).toBeInstanceOf(AbortSignal);
	});

	it("answers 503 when Resend refuses the email, logging why without its content", async () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		const { mailer } = mailerAnswering(async () =>
			Response.json(
				{
					statusCode: 403,
					name: "validation_error",
					message: "The checkit.example.com domain is not verified.",
				},
				{ status: 403 },
			),
		);

		const error = await mailer.send(message).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({ status: 503, code: "email_unavailable" });
		const logged = log.mock.calls.flat().join(" ");
		expect(logged).toContain("403 validation_error");
		expect(logged).toContain("domain is not verified");
		expect(logged).not.toContain("123456");
	});

	it("answers 503 when Resend can't be reached or doesn't answer in time", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const { mailer } = mailerAnswering(async () => {
			throw new DOMException("The operation timed out.", "TimeoutError");
		});

		await expect(mailer.send(message)).rejects.toMatchObject({
			status: 503,
			code: "email_unavailable",
		});
	});
});
