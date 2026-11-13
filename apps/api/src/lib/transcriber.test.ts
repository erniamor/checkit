import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { createMistralTranscriber } from "@/lib/transcriber";

const audio = new Blob(["sound"], { type: "audio/webm;codecs=opus" });

function transcriberAnswering(respond: () => Promise<Response>) {
	const fetch = vi.fn<typeof globalThis.fetch>(respond);
	return {
		transcriber: createMistralTranscriber({ apiKey: "mistral_key", fetch }),
		fetch,
	};
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("createMistralTranscriber", () => {
	it("sends the recording to Mistral, named by its type, in the language", async () => {
		const { transcriber, fetch } = transcriberAnswering(async () =>
			Response.json({ text: "du lait et des œufs", model: "voxtral" }),
		);

		expect(await transcriber.transcribe(audio, "fr")).toBe(
			"du lait et des œufs",
		);
		const [url, init] = fetch.mock.calls[0] ?? [];
		expect(url).toBe("https://api.mistral.ai/v1/audio/transcriptions");
		expect(init?.method).toBe("POST");
		expect(init?.headers).toEqual({ Authorization: "Bearer mistral_key" });
		expect(init?.signal).toBeInstanceOf(AbortSignal);
		const form = init?.body as FormData;
		expect(form.get("model")).toBe("voxtral-mini-latest");
		expect(form.get("language")).toBe("fr");
		const file = form.get("file") as File;
		expect(file.name).toBe("recording.webm");
		expect(await file.text()).toBe("sound");
	});

	it("answers 502 when Mistral refuses, logging only its status", async () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const { transcriber } = transcriberAnswering(async () =>
			Response.json({ message: "Unauthorized" }, { status: 401 }),
		);

		await expect(transcriber.transcribe(audio, "en")).rejects.toMatchObject({
			constructor: AppError,
			status: 502,
			code: "transcription_failed",
		});
		expect(error).toHaveBeenCalledWith(
			"[transcription] Mistral refused the recording: 401",
		);
	});

	it("answers 502 when Mistral can't be reached", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const { transcriber } = transcriberAnswering(async () => {
			throw new TypeError("fetch failed");
		});

		await expect(transcriber.transcribe(audio, "es")).rejects.toMatchObject({
			status: 502,
		});
	});
});
