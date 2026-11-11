import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
	ApiError,
	ForbiddenError,
	NetworkError,
	NotFoundError,
	RateLimitError,
	ServerError,
	UnauthorizedError,
	ValidationError,
} from "../errors";
import { fakeFetch } from "../test/fake-fetch";
import { createApiClient } from "./client";

function client(status: number, body?: unknown) {
	const fake = fakeFetch(status, body);
	return {
		...fake,
		client: createApiClient({
			baseUrl: "http://api.test",
			fetch: fake.fetch,
			credentials: "include",
			headers: () => ({ Cookie: "session=abc", "X-Missing": undefined }),
		}),
	};
}

describe("createApiClient", () => {
	it("sends the request under /v1 with its headers, body and credentials", async () => {
		const { client: api, requests } = client(200, { ok: true });

		await api.request({
			method: "PATCH",
			path: "/me",
			body: { name: "Alice" },
		});

		expect(requests).toEqual([
			{
				url: "http://api.test/v1/me",
				method: "PATCH",
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					cookie: "session=abc",
				},
				body: { name: "Alice" },
				credentials: "include",
			},
		]);
	});

	it("returns the response validated by its schema", async () => {
		const { client: api } = client(200, { name: "Alice", extra: true });

		const result = await api.request({
			path: "/me",
			response: z.object({ name: z.string() }),
		});

		expect(result).toEqual({ name: "Alice" });
	});

	it("rejects a response that doesn't match the contract", async () => {
		const { client: api } = client(200, { name: 42 });

		await expect(
			api.request({ path: "/me", response: z.object({ name: z.string() }) }),
		).rejects.toMatchObject({
			name: "ServerError",
			code: "unexpected_response",
		});
	});

	it("accepts an empty 204 response", async () => {
		const { client: api } = client(204);

		await expect(api.request({ method: "DELETE", path: "/x" })).resolves.toBe(
			undefined,
		);
	});

	it.each([
		[401, "unauthorized", UnauthorizedError],
		[403, "forbidden", ForbiddenError],
		[404, "list_not_found", NotFoundError],
		[429, "too_many_invitations", RateLimitError],
		[500, "internal_error", ServerError],
		[410, "invitation_expired", ApiError],
	])("turns a %i into a typed error", async (status, code, ErrorClass) => {
		const { client: api } = client(status, {
			error: { code, message: "Nope" },
		});

		const error = await api.request({ path: "/x" }).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ErrorClass);
		expect(error).toMatchObject({ status, code, message: "Nope" });
	});

	it("keeps the validation details of a 422", async () => {
		const { client: api } = client(422, {
			error: {
				code: "validation_error",
				message: "Invalid request",
				details: [{ field: "name", message: "name_required" }],
			},
		});

		const error = await api.request({ path: "/me" }).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ValidationError);
		expect((error as ValidationError).issues).toEqual([
			{ field: "name", message: "name_required" },
		]);
	});

	it("reads Better Auth's errors, with lowercase codes", async () => {
		const { client: api } = client(400, {
			code: "INVALID_OTP",
			message: "Invalid OTP",
		});

		await expect(api.request({ path: "/auth/x" })).rejects.toMatchObject({
			name: "ValidationError",
			code: "invalid_otp",
		});
	});

	it("handles an error without a readable body", async () => {
		const { client: api } = client(502);

		await expect(api.request({ path: "/x" })).rejects.toMatchObject({
			name: "ServerError",
			code: "http_502",
		});
	});

	it("turns an unreachable API into a NetworkError", async () => {
		const api = createApiClient({
			baseUrl: "http://api.test",
			fetch: vi.fn(async () => {
				throw new TypeError("Failed to fetch");
			}),
		});

		await expect(api.request({ path: "/x" })).rejects.toBeInstanceOf(
			NetworkError,
		);
	});

	it("lets a cancellation through as is", async () => {
		const controller = new AbortController();
		controller.abort();
		const api = createApiClient({
			baseUrl: "http://api.test",
			fetch: vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
				init?.signal?.throwIfAborted();
				return new Response(null);
			}),
		});

		await expect(
			api.request({ path: "/x", signal: controller.signal }),
		).rejects.toMatchObject({ name: "AbortError" });
	});
});
