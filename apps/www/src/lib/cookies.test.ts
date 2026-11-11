import { describe, expect, it } from "vitest";
import { readCookie } from "@/lib/cookies";

describe("readCookie", () => {
	it("finds a cookie among others", () => {
		expect(readCookie("a=1; appearance=dark; b=2", "appearance")).toBe("dark");
	});

	it("decodes the value", () => {
		expect(readCookie("name=a%3Db", "name")).toBe("a=b");
	});

	it("returns undefined for a missing cookie", () => {
		expect(readCookie("a=1", "appearance")).toBeUndefined();
		expect(readCookie("", "appearance")).toBeUndefined();
	});
});
