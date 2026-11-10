import type { Locale } from "@/lib/locale";
import type { EmailMessage } from "@/lib/mailer";

interface SignInMessages {
	linkSubject: string;
	linkText: (url: string, minutes: number) => string;
	codeSubject: (code: string) => string;
	codeText: (code: string, minutes: number) => string;
}

const messages: Record<Locale, SignInMessages> = {
	fr: {
		linkSubject: "Votre lien de connexion à Checkit",
		linkText: (url, minutes) =>
			`Bonjour,\n\nCliquez sur ce lien pour vous connecter à Checkit :\n${url}\n\nCe lien est valable ${minutes} minutes et ne fonctionne qu'une fois.\nSi vous n'avez pas demandé à vous connecter, ignorez cet e-mail.`,
		codeSubject: (code) => `Votre code de connexion à Checkit : ${code}`,
		codeText: (code, minutes) =>
			`Bonjour,\n\nVotre code de connexion à Checkit est : ${code}\n\nCe code est valable ${minutes} minutes.\nSi vous n'avez pas demandé à vous connecter, ignorez cet e-mail.`,
	},
	en: {
		linkSubject: "Your Checkit sign-in link",
		linkText: (url, minutes) =>
			`Hello,\n\nClick this link to sign in to Checkit:\n${url}\n\nThis link is valid for ${minutes} minutes and works only once.\nIf you didn't ask to sign in, ignore this email.`,
		codeSubject: (code) => `Your Checkit sign-in code: ${code}`,
		codeText: (code, minutes) =>
			`Hello,\n\nYour Checkit sign-in code is: ${code}\n\nThis code is valid for ${minutes} minutes.\nIf you didn't ask to sign in, ignore this email.`,
	},
};

interface SignInEmailInput {
	to: string;
	locale: Locale;
	expiresInMinutes: number;
}

export function signInLinkEmail({
	to,
	url,
	locale,
	expiresInMinutes,
}: SignInEmailInput & { url: string }): EmailMessage {
	const m = messages[locale];
	return {
		to,
		subject: m.linkSubject,
		text: m.linkText(url, expiresInMinutes),
	};
}

export function signInCodeEmail({
	to,
	code,
	locale,
	expiresInMinutes,
}: SignInEmailInput & { code: string }): EmailMessage {
	const m = messages[locale];
	return {
		to,
		subject: m.codeSubject(code),
		text: m.codeText(code, expiresInMinutes),
	};
}
