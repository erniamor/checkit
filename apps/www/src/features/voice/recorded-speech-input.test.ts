import { NetworkError, RateLimitError, ServerError } from "@repo/resources";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	MAX_RECORDING_MS,
	recordedSpeechInput,
} from "@/features/voice/recorded-speech-input";
import {
	FakeMediaRecorder,
	installMediaRecorder,
} from "@/test/fake-media-recorder";

function handlers() {
	return {
		onText: vi.fn(),
		onTranscribing: vi.fn(),
		onEnd: vi.fn(),
		onError: vi.fn(),
	};
}

/** Starts recording, once the microphone is given. */
async function startRecording(
	transcribe = vi.fn(async () => "du lait"),
	options?: { denied?: boolean },
) {
	const microphone = installMediaRecorder(options);
	const input = recordedSpeechInput(window, transcribe);
	const listeners = handlers();
	const session = input?.start("fr-CA", listeners);
	await vi.waitFor(() =>
		expect(microphone.getUserMedia).toHaveBeenCalledWith({ audio: true }),
	);
	return { microphone, session, listeners, transcribe };
}

describe("recordedSpeechInput", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("is missing where the browser can't record", () => {
		expect(recordedSpeechInput(window, vi.fn())).toBeUndefined();
	});

	it("records until stopped, then transcribes in the app's language", async () => {
		const { microphone, session, listeners, transcribe } =
			await startRecording();
		await vi.waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
		const recorder = FakeMediaRecorder.latest();
		expect(recorder.options).toEqual({ audioBitsPerSecond: 32_000 });

		recorder.say("sound");
		session?.stop();

		expect(microphone.on()).toBe(false);
		expect(listeners.onTranscribing).toHaveBeenCalled();
		const [audio, language] = transcribe.mock.calls[0] as unknown as [
			Blob,
			string,
		];
		expect(language).toBe("fr");
		expect(audio.type).toBe("audio/ogg;codecs=opus");
		expect(await audio.text()).toBe("sound");
		await vi.waitFor(() =>
			expect(listeners.onEnd).toHaveBeenCalledWith("du lait"),
		);
		expect(listeners.onText).not.toHaveBeenCalled();
	});

	it("stops by itself after the longest recording", async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const { listeners } = await startRecording();
		await vi.waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
		FakeMediaRecorder.latest().say("sound");

		vi.advanceTimersByTime(MAX_RECORDING_MS);

		expect(FakeMediaRecorder.latest().state).toBe("inactive");
		expect(listeners.onTranscribing).toHaveBeenCalled();
	});

	it("stops at once when stopped before the microphone was given", async () => {
		installMediaRecorder();
		const listeners = handlers();
		const session = recordedSpeechInput(window, vi.fn())?.start(
			"en-US",
			listeners,
		);

		session?.stop();

		await vi.waitFor(() => expect(listeners.onEnd).toHaveBeenCalledWith(""));
	});

	it("reports a refused microphone", async () => {
		const { listeners } = await startRecording(undefined, { denied: true });

		await vi.waitFor(() =>
			expect(listeners.onError).toHaveBeenCalledWith("not-allowed"),
		);
	});

	it.each([
		[new NetworkError(new TypeError("offline")), "network"],
		[new RateLimitError(429, "too_many_transcriptions", ""), "too-many"],
		[new ServerError(503, "transcription_unavailable", ""), "unavailable"],
		[new ServerError(502, "transcription_failed", ""), "failed"],
	])("reports a failed transcription (%s)", async (error, expected) => {
		const { session, listeners } = await startRecording(
			vi.fn(async () => {
				throw error;
			}),
		);
		await vi.waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
		FakeMediaRecorder.latest().say("sound");

		session?.stop();

		await vi.waitFor(() =>
			expect(listeners.onError).toHaveBeenCalledWith(expected),
		);
	});

	it("drops the recording once aborted", async () => {
		const { microphone, session, listeners, transcribe } =
			await startRecording();
		await vi.waitFor(() => expect(FakeMediaRecorder.instances).toHaveLength(1));
		FakeMediaRecorder.latest().say("sound");

		session?.abort();

		expect(microphone.on()).toBe(false);
		expect(transcribe).not.toHaveBeenCalled();
		expect(listeners.onEnd).not.toHaveBeenCalled();
	});
});
