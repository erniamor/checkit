import {
	ApiError,
	NetworkError,
	RateLimitError,
	ValidationError,
} from "@repo/resources";
import { ITEM_LABEL_TAKEN } from "@repo/schemas";
import { m } from "@/paraglide/messages";

// Error codes from @repo/schemas and the API, translated for the user
const messagesByCode: Record<string, () => string> = {
	email_invalid: m.error_email_invalid,
	code_invalid: m.error_code_invalid,
	invalid_otp: m.error_invalid_otp,
	otp_expired: m.error_otp_expired,
	too_many_attempts: m.error_too_many_attempts,
	name_required: m.error_name_required,
	name_too_long: m.error_name_too_long,
	list_name_required: m.error_list_name_required,
	list_name_too_long: m.error_list_name_too_long,
	item_label_required: m.error_item_label_required,
	item_label_too_long: m.error_item_label_too_long,
	[ITEM_LABEL_TAKEN]: m.error_item_label_taken_any,
	already_member: m.error_already_member,
	too_many_invitations: m.error_too_many_invitations,
};

export function errorMessage(code: string): string {
	return (messagesByCode[code] ?? m.error_generic)();
}

export interface FormErrors {
	/** Message for the whole form. */
	form?: string;
	/** Message per field, keyed by field name. */
	fields: Record<string, string>;
}

/** Turns an error from @repo/resources into messages to show in a form. */
export function formErrors(error: unknown): FormErrors {
	if (error instanceof ValidationError && error.issues.length > 0) {
		return {
			fields: Object.fromEntries(
				error.issues.map((issue) => [issue.field, errorMessage(issue.message)]),
			),
		};
	}
	if (error instanceof ValidationError) {
		return { form: errorMessage(error.code), fields: {} };
	}
	if (error instanceof RateLimitError) {
		// A specific limit (e.g. too_many_invitations) has its own message
		return {
			form:
				error.code in messagesByCode
					? errorMessage(error.code)
					: m.error_too_many_requests(),
			fields: {},
		};
	}
	if (error instanceof NetworkError) {
		return { form: m.error_network(), fields: {} };
	}
	if (
		error instanceof Error &&
		"code" in error &&
		typeof error.code === "string"
	) {
		return { form: errorMessage(error.code), fields: {} };
	}
	return { form: m.error_generic(), fields: {} };
}

/**
 * Message for a change that was shown at once, then refused: an offline user
 * or a rate limit get their own message, anything else says it wasn't saved.
 */
export function saveErrorMessage(error: unknown): string {
	if (error instanceof NetworkError) {
		return m.error_network();
	}
	if (error instanceof RateLimitError) {
		return m.error_too_many_requests();
	}
	// The list changed meanwhile: another member gave an item this label
	if (error instanceof ApiError && error.code === ITEM_LABEL_TAKEN) {
		return m.error_item_label_taken_any();
	}
	return m.error_save_failed();
}
