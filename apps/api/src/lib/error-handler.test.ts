import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleError } from "@/lib/error-handler";
import { AppError } from "@/lib/errors";

function appThrowing(error: unknown) {
	const app = new Hono().get("/", () => {
		throw error;
	});
	app.onError(handleError);
	return app;
}

describe("handleError", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("turns an AppError into its status and error body", async () => {
		const response = await appThrowing(
			new AppError(409, "list_name_taken", "This name is already used", {
				field: "name",
			}),
		).request("/");

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			error: {
				code: "list_name_taken",
				message: "This name is already used",
				details: { field: "name" },
			},
		});
	});

	it("maps an HTTPException status to an error code", async () => {
		const response = await appThrowing(
			new HTTPException(401, { message: "Sign-in required" }),
		).request("/");

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error: { code: "unauthorized", message: "Sign-in required" },
		});
	});

	it("hides the details of an unexpected error", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});

		const response = await appThrowing(
			new Error("connection string leaked"),
		).request("/");

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: { code: "internal_error", message: "Internal server error" },
		});
	});
});
