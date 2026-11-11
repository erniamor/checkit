import {
	apiErrorBodySchema,
	type ValidationIssue,
	validationIssueSchema,
} from "@repo/schemas";
import { z } from "zod";
import {
	ApiError,
	ForbiddenError,
	NotFoundError,
	RateLimitError,
	ServerError,
	UnauthorizedError,
	ValidationError,
} from "../errors";

// Better Auth's routes (/auth/*) answer errors as { code, message }, with
// uppercase codes such as INVALID_OTP
const betterAuthErrorSchema = z.object({
	code: z.string(),
	message: z.string().optional(),
});

interface ErrorFields {
	code: string;
	message: string;
	issues: ValidationIssue[];
}

/** Reads either error format; codes are lowercased like the API's. */
function readErrorFields(status: number, body: unknown): ErrorFields {
	const api = apiErrorBodySchema.safeParse(body);
	if (api.success) {
		const issues = z
			.array(validationIssueSchema)
			.safeParse(api.data.error.details);
		return {
			code: api.data.error.code,
			message: api.data.error.message,
			issues: issues.success ? issues.data : [],
		};
	}
	const betterAuth = betterAuthErrorSchema.safeParse(body);
	if (betterAuth.success) {
		return {
			code: betterAuth.data.code.toLowerCase(),
			message: betterAuth.data.message ?? betterAuth.data.code,
			issues: [],
		};
	}
	return {
		code: `http_${status}`,
		message: `Request failed (${status})`,
		issues: [],
	};
}

/** Builds the typed error matching an error response. */
export function toApiError(status: number, body: unknown): ApiError {
	const { code, message, issues } = readErrorFields(status, body);
	if (status === 400 || status === 422) {
		return new ValidationError(status, code, message, issues);
	}
	if (status === 401) {
		return new UnauthorizedError(status, code, message);
	}
	if (status === 403) {
		return new ForbiddenError(status, code, message);
	}
	if (status === 404) {
		return new NotFoundError(status, code, message);
	}
	if (status === 429) {
		return new RateLimitError(status, code, message);
	}
	if (status >= 500) {
		return new ServerError(status, code, message);
	}
	return new ApiError(status, code, message);
}

/** An invalid input caught before sending, in the same shape as the API's 422. */
export function toInputError(error: z.ZodError): ValidationError {
	return new ValidationError(
		422,
		"validation_error",
		"Invalid request",
		error.issues.map((issue) => ({
			field: issue.path.map(String).join("."),
			message: issue.message,
		})),
	);
}
