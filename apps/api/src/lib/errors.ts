import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface ErrorBody {
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
}

/** Expected error, turned into an `ErrorBody` response by the global error handler. */
export class AppError extends Error {
	readonly status: ContentfulStatusCode;
	readonly code: string;
	readonly details?: unknown;

	constructor(
		status: ContentfulStatusCode,
		code: string,
		message: string,
		details?: unknown,
	) {
		super(message);
		this.name = "AppError";
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export function errorBody(
	code: string,
	message: string,
	details?: unknown,
): ErrorBody {
	return {
		error:
			details === undefined ? { code, message } : { code, message, details },
	};
}
