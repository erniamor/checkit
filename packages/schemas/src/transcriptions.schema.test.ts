import { describe, expect, it } from "vitest";
import {
	transcriptionQuerySchema,
	transcriptionSchema,
} from "./transcriptions.schema";

describe("transcriptionQuerySchema", () => {
	it("accepts the apps' languages only", () => {
		expect(transcriptionQuerySchema.parse({ language: "fr" })).toEqual({
			language: "fr",
		});
		expect(transcriptionQuerySchema.safeParse({ language: "de" }).success).toBe(
			false,
		);
		expect(
			transcriptionQuerySchema.safeParse({ language: "en", extra: "1" })
				.success,
		).toBe(false);
	});
});

describe("transcriptionSchema", () => {
	it("describes the transcribed text, maybe empty", () => {
		expect(transcriptionSchema.parse({ text: "" })).toEqual({ text: "" });
	});
});
