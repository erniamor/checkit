import { describe, expect, it } from "vitest";
import { ServerError, ValidationError } from "../errors";
import { fakeApi } from "../test/fake-fetch";

const audio = new Blob(["sound"], { type: "audio/webm;codecs=opus" });

describe("transcriptions", () => {
	it("sends the recording as is, with its type and language", async () => {
		const { api, requests } = fakeApi(200, { text: "milk and eggs" });

		expect(await api.transcriptions.create(audio, { language: "fr" })).toBe(
			"milk and eggs",
		);
		expect(requests[0]).toMatchObject({
			url: "http://api.test/v1/transcriptions?language=fr",
			method: "POST",
			headers: { "content-type": "audio/webm;codecs=opus" },
			body: audio,
		});
	});

	it("refuses an unknown language before sending", async () => {
		const { api, fetch } = fakeApi(200, { text: "" });

		await expect(
			// @ts-expect-error: the language is checked at runtime too
			api.transcriptions.create(audio, { language: "de" }),
		).rejects.toBeInstanceOf(ValidationError);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("says when the API has no transcription service", async () => {
		const { api } = fakeApi(503, {
			error: { code: "transcription_unavailable", message: "" },
		});

		await expect(
			api.transcriptions.create(audio, { language: "en" }),
		).rejects.toMatchObject({
			constructor: ServerError,
			code: "transcription_unavailable",
		});
	});
});
