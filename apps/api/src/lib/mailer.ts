import { env } from "@/env";
import { AppError } from "@/lib/errors";

export interface EmailMessage {
	to: string;
	subject: string;
	text: string;
}

export interface Mailer {
	send(message: EmailMessage): Promise<void>;
}

// Development and tests without Resend: prints the email instead of sending
// it. Never used in production, where sign-in links and codes would end up in
// the logs (the environment requires Resend there).
const consoleMailer: Mailer = {
	async send(message) {
		console.info(
			`[mail] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`,
		);
	},
};

const RESEND_URL = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 10_000;

interface ResendOptions {
	apiKey: string;
	/** Sender, as `Name <address>` or `address`, on a domain verified in Resend. */
	from: string;
	fetch?: typeof fetch;
}

function emailUnavailable(): AppError {
	return new AppError(503, "email_unavailable", "The email could not be sent");
}

/** Reads Resend's error body (`{ name, message }`) without failing on another body. */
async function describeResendError(response: Response): Promise<string> {
	const body: unknown = await response.json().catch(() => null);
	if (body && typeof body === "object") {
		const { name, message } = body as Record<string, unknown>;
		return `${response.status} ${String(name)}: ${String(message)}`;
	}
	return String(response.status);
}

/**
 * Sends emails with Resend's REST API. A failure is logged without the email's
 * content (it holds sign-in links and codes) and answered with a 503.
 */
export function createResendMailer({
	apiKey,
	from,
	fetch: send = fetch,
}: ResendOptions): Mailer {
	return {
		async send(message) {
			let response: Response;
			try {
				response = await send(RESEND_URL, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						from,
						to: [message.to],
						subject: message.subject,
						text: message.text,
					}),
					signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
				});
			} catch (error) {
				console.error("[mail] Resend could not be reached", error);
				throw emailUnavailable();
			}
			if (!response.ok) {
				console.error(
					`[mail] Resend refused the email: ${await describeResendError(response)}`,
				);
				throw emailUnavailable();
			}
		},
	};
}

export const mailer: Mailer =
	env.RESEND_API_KEY && env.EMAIL_FROM
		? createResendMailer({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM })
		: consoleMailer;
