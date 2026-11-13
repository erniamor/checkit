import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
	it("allows `limit` uses per key within the window, then again after it", () => {
		let time = 0;
		const limiter = createRateLimiter({
			limit: 2,
			windowMs: 1000,
			now: () => time,
		});

		expect(limiter.take("alice")).toBe(true);
		time = 500;
		expect(limiter.take("alice")).toBe(true);
		expect(limiter.take("alice")).toBe(false);
		expect(limiter.take("bob")).toBe(true);

		time = 1000;
		expect(limiter.take("alice")).toBe(true);
		expect(limiter.take("alice")).toBe(false);
	});
});
