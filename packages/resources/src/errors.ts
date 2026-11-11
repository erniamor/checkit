import type { ValidationIssue } from "@repo/schemas";

/** Error answered by the API, with its status and error code. */
export class ApiError extends Error {
	readonly status: number;
	/** Error code, e.g. "list_not_found": what the front ends translate. */
	readonly code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

/** Invalid input (400 or 422), checked before sending or by the API. */
export class ValidationError extends ApiError {
	/** Invalid fields, with their error code; empty when the API gave none. */
	readonly issues: ValidationIssue[];

	constructor(
		status: number,
		code: string,
		message: string,
		issues: ValidationIssue[],
	) {
		super(status, code, message);
		this.name = "ValidationError";
		this.issues = issues;
	}
}

/** 401: no valid session. */
export class UnauthorizedError extends ApiError {
	override name = "UnauthorizedError";
}

/** 403: the user isn't allowed to do this. */
export class ForbiddenError extends ApiError {
	override name = "ForbiddenError";
}

/** 404: unknown resource, or one the user can't see. */
export class NotFoundError extends ApiError {
	override name = "NotFoundError";
}

/** 429: too many requests, try again later. */
export class RateLimitError extends ApiError {
	override name = "RateLimitError";
}

/** 5xx, or a response that doesn't match the expected contract. */
export class ServerError extends ApiError {
	override name = "ServerError";
}

/** The API couldn't be reached (offline, DNS, CORS...). */
export class NetworkError extends Error {
	constructor(cause: unknown) {
		super("The API couldn't be reached", { cause });
		this.name = "NetworkError";
	}
}
