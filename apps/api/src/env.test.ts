import { describe, expect, it } from "vitest";
import { parseEnv } from "@/env";

const validSource = {
	NODE_ENV: "production",
	PORT: "8080",
	DATABASE_URL: "postgres://user:password@db.example.com:5432/checkit",
	CORS_ORIGINS: "https://checkit.example.com, https://www.checkit.example.com",
};

describe("parseEnv", () => {
	it("parses a valid environment", () => {
		expect(parseEnv(validSource)).toEqual({
			NODE_ENV: "production",
			PORT: 8080,
			DATABASE_URL: "postgres://user:password@db.example.com:5432/checkit",
			CORS_ORIGINS: [
				"https://checkit.example.com",
				"https://www.checkit.example.com",
			],
		});
	});

	it("applies defaults for NODE_ENV and PORT", () => {
		const { NODE_ENV, PORT, ...required } = validSource;
		expect(parseEnv(required)).toMatchObject({
			NODE_ENV: "development",
			PORT: 3001,
		});
	});

	it("rejects a missing DATABASE_URL", () => {
		const { DATABASE_URL, ...rest } = validSource;
		expect(() => parseEnv(rest)).toThrow(/DATABASE_URL/);
	});

	it("rejects a non-PostgreSQL DATABASE_URL", () => {
		expect(() =>
			parseEnv({ ...validSource, DATABASE_URL: "mysql://localhost/checkit" }),
		).toThrow(/DATABASE_URL/);
	});

	it("rejects an invalid CORS origin", () => {
		expect(() =>
			parseEnv({ ...validSource, CORS_ORIGINS: "not-a-url" }),
		).toThrow(/CORS_ORIGINS/);
	});
});
