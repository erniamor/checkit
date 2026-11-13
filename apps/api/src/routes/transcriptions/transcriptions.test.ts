import { signIn, WEB_ORIGIN } from "@test/helpers/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "@/app";
import { transcriber } from "@/lib/transcriber";
import { TRANSCRIPTIONS_PER_HOUR } from "@/routes/transcriptions/transcriptions.service";

afterEach(() => {
	vi.restoreAllMocks();
});

function postRecording(
	cookie: string | undefined,
	{
		language = "fr",
		body = "sound",
		type = "audio/webm;codecs=opus",
	}: { language?: string; body?: string | Uint8Array; type?: string } = {},
) {
	return app.request(`/v1/transcriptions?language=${language}`, {
		method: "POST",
		headers: {
			Origin: WEB_ORIGIN,
			"Content-Type": type,
			...(cookie && { Cookie: cookie }),
		},
		body,
	});
}

function transcribeAs(text: string) {
	return vi.spyOn(transcriber, "transcribe").mockResolvedValue(text);
}

describe("POST /v1/transcriptions", () => {
	it("requires a session", async () => {
		const transcribe = transcribeAs("milk");

		expect((await postRecording(undefined)).status).toBe(401);
		expect(transcribe).not.toHaveBeenCalled();
	});

	it("transcribes the recording in the given language", async () => {
		const transcribe = transcribeAs(" du lait et des œufs ");
		const cookie = await signIn("alice@example.com");

		const response = await postRecording(cookie);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ text: "du lait et des œufs" });
		const [audio, language] = transcribe.mock.calls[0] ?? [];
		expect(language).toBe("fr");
		expect(audio?.type).toBe("audio/webm;codecs=opus");
		expect(await audio?.text()).toBe("sound");
	});

	it("refuses an unknown language, a body that isn't audio, or an empty one", async () => {
		const transcribe = transcribeAs("milk");
		const cookie = await signIn("alice@example.com");

		expect((await postRecording(cookie, { language: "de" })).status).toBe(422);
		const notAudio = await postRecording(cookie, { type: "application/json" });
		expect(notAudio.status).toBe(422);
		expect(await notAudio.json()).toMatchObject({
			error: {
				code: "validation_error",
				details: [{ field: "content-type", message: "audio_required" }],
			},
		});
		const empty = await postRecording(cookie, { body: "" });
		expect(empty.status).toBe(422);
		expect(await empty.json()).toMatchObject({
			error: { code: "audio_required" },
		});
		expect(transcribe).not.toHaveBeenCalled();
	});

	it("refuses a recording over the body size limit", async () => {
		const transcribe = transcribeAs("milk");
		const cookie = await signIn("alice@example.com");

		const response = await postRecording(cookie, {
			body: new Uint8Array(1024 * 1024 + 1),
		});

		expect(response.status).toBe(413);
		expect(transcribe).not.toHaveBeenCalled();
	});

	it("limits the transcriptions per user and hour", async () => {
		transcribeAs("milk");
		const alice = await signIn("alice@example.com");
		const bob = await signIn("bob@example.com");

		for (let count = 0; count < TRANSCRIPTIONS_PER_HOUR; count++) {
			expect((await postRecording(alice)).status).toBe(200);
		}
		const refused = await postRecording(alice);

		expect(refused.status).toBe(429);
		expect(await refused.json()).toMatchObject({
			error: { code: "too_many_transcriptions" },
		});
		expect((await postRecording(bob)).status).toBe(200);
	});

	it("answers 503 when no transcription service is configured", async () => {
		const cookie = await signIn("alice@example.com");

		const response = await postRecording(cookie);

		expect(response.status).toBe(503);
		expect(await response.json()).toMatchObject({
			error: { code: "transcription_unavailable" },
		});
	});
});
