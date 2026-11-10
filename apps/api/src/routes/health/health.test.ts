import { describe, expect, it } from "vitest";
import { app } from "@/app";
import { createDatabase } from "@/db/client";
import { getHealth } from "@/routes/health/health.service";

describe("GET /v1/health", () => {
	it("reports the API and the database as up", async () => {
		const response = await app.request("/v1/health");

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: "ok", database: "up" });
	});
});

describe("getHealth", () => {
	it("reports the database as down when it is unreachable", async () => {
		// Nothing listens on port 1: the connection is refused immediately
		const { client, db } = createDatabase(
			"postgres://checkit:checkit@127.0.0.1:1/checkit",
		);
		try {
			expect(await getHealth(db)).toEqual({
				status: "degraded",
				database: "down",
			});
		} finally {
			await client.end();
		}
	});
});
