import { describe, expect, it } from "vitest";
import { app } from "@/app";

describe("app", () => {
	it("returns a JSON 404 for an unknown route", async () => {
		const response = await app.request("/v1/unknown");

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: { code: "not_found", message: "Route not found" },
		});
	});

	it("allows an origin listed in CORS_ORIGINS", async () => {
		const response = await app.request("/v1/health", {
			headers: { Origin: "http://localhost:3000" },
		});

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
			"http://localhost:3000",
		);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
			"true",
		);
	});

	it("does not allow an unknown origin", async () => {
		const response = await app.request("/v1/health", {
			headers: { Origin: "https://evil.example.com" },
		});

		expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});

	it("sets security headers", async () => {
		const response = await app.request("/v1/health");

		expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
	});

	it("rejects a body larger than 1 MB", async () => {
		const response = await app.request("/v1/health", {
			method: "POST",
			body: "x".repeat(1024 * 1024 + 1),
		});

		expect(response.status).toBe(413);
		expect(await response.json()).toEqual({
			error: {
				code: "payload_too_large",
				message: "Request body is too large",
			},
		});
	});
});
