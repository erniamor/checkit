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

// Development and tests: prints the email instead of sending it. Never used in
// production, where sign-in links and codes would end up in the logs.
const consoleMailer: Mailer = {
	async send(message) {
		console.info(
			`[mail] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`,
		);
	},
};

// Production until an email provider is chosen: sign-in by email is unavailable.
const unconfiguredMailer: Mailer = {
	async send() {
		throw new AppError(
			503,
			"email_unavailable",
			"Email sending is not configured",
		);
	},
};

export const mailer: Mailer =
	env.NODE_ENV === "production" ? unconfiguredMailer : consoleMailer;
