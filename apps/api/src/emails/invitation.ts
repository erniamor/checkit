import type { ShareableRole } from "@repo/schemas";
import type { Locale } from "@/lib/locale";
import type { EmailMessage } from "@/lib/mailer";

interface InvitationMessages {
	subject: (inviter: string, listName: string) => string;
	text: (
		inviter: string,
		listName: string,
		role: ShareableRole,
		url: string,
		days: number,
	) => string;
}

const messages: Record<Locale, InvitationMessages> = {
	en: {
		subject: (inviter, listName) =>
			`${inviter} invited you to the list “${listName}” on Checkit`,
		text: (inviter, listName, role, url, days) =>
			`Hello,\n\n${inviter} invited you to ${role === "editor" ? "edit" : "view"} the list “${listName}” on Checkit.\n\nOpen this link to join it:\n${url}\n\nThe invitation is valid for ${days} days.\nIf you weren't expecting it, ignore this email.`,
	},
	fr: {
		subject: (inviter, listName) =>
			`${inviter} vous invite à la liste « ${listName} » sur Checkit`,
		text: (inviter, listName, role, url, days) =>
			`Bonjour,\n\n${inviter} vous invite à ${role === "editor" ? "modifier" : "consulter"} la liste « ${listName} » sur Checkit.\n\nOuvrez ce lien pour la rejoindre :\n${url}\n\nL'invitation est valable ${days} jours.\nSi vous ne l'attendiez pas, ignorez cet e-mail.`,
	},
	es: {
		subject: (inviter, listName) =>
			`${inviter} te invita a la lista «${listName}» en Checkit`,
		text: (inviter, listName, role, url, days) =>
			`Hola:\n\n${inviter} te invita a ${role === "editor" ? "editar" : "ver"} la lista «${listName}» en Checkit.\n\nAbre este enlace para unirte:\n${url}\n\nLa invitación es válida durante ${days} días.\nSi no la esperabas, ignora este correo.`,
	},
};

interface InvitationEmailInput {
	to: string;
	inviter: string;
	listName: string;
	role: ShareableRole;
	url: string;
	locale: Locale;
	expiresInDays: number;
}

export function invitationEmail({
	to,
	inviter,
	listName,
	role,
	url,
	locale,
	expiresInDays,
}: InvitationEmailInput): EmailMessage {
	const m = messages[locale];
	return {
		to,
		subject: m.subject(inviter, listName),
		text: m.text(inviter, listName, role, url, expiresInDays),
	};
}
