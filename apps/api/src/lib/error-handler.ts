import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { AppError, errorBody } from "@/lib/errors";

const codesByStatus: Partial<Record<number, string>> = {
	400: "bad_request",
	401: "unauthorized",
	403: "forbidden",
	404: "not_found",
	409: "conflict",
	413: "payload_too_large",
	422: "validation_error",
	429: "too_many_requests",
};

export const handleError: ErrorHandler = (error, c) => {
	if (error instanceof AppError) {
		return c.json(
			errorBody(error.code, error.message, error.details),
			error.status,
		);
	}
	if (error instanceof HTTPException) {
		return c.json(
			errorBody(
				codesByStatus[error.status] ?? "http_error",
				error.message || "Request failed",
			),
			error.status,
		);
	}
	// Unexpected error: log it, but never expose its details to the client
	console.error(error);
	return c.json(errorBody("internal_error", "Internal server error"), 500);
};

export const handleNotFound: NotFoundHandler = (c) =>
	c.json(errorBody("not_found", "Route not found"), 404);
