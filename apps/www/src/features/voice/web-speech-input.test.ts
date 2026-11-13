import { afterEach, describe, expect, it, vi } from "vitest";
import {
	SILENCE_TIMEOUT_MS,
	webSpeechInput,
} from "@/features/voice/web-speech-input";
import {
	FakeSpeechRecognition,
	installSpeechRecognition,
} from "@/test/fake-speech-recognition";

function startListening() {
	installSpeechRecognition();
	const input = webSpeechInput(window);
	const handlers = { onText: vi.fn(), onEnd: vi.fn(), onError: vi.fn() };
	const session = input?.start("fr-CA", handlers);
	return { handlers, session, recognition: FakeSpeechRecognition.latest() };
}

describe("webSpeechInput", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("is missing where the browser can't recognize speech", () => {
		expect(webSpeechInput(window)).toBeUndefined();
	});

	it("listens in the given language through pauses", () => {
		const { recognition } = startListening();

		expect(recognition).toMatchObject({
			lang: "fr-CA",
			continuous: true,
			interimResults: true,
			listening: true,
		});
	});

	it("gives the text as it's heard, then all of it when stopped", () => {
		const { handlers, session, recognition } = startListening();

		recognition.hear("du lait");
		recognition.hear("du lait", " et des œufs");
		session?.stop();

		expect(handlers.onText).toHaveBeenLastCalledWith("du lait et des œufs");
		expect(handlers.onEnd).toHaveBeenCalledWith("du lait et des œufs");
		expect(handlers.onError).not.toHaveBeenCalled();
	});

	it("stops by itself after a silence", () => {
		vi.useFakeTimers();
		const { handlers, recognition } = startListening();

		recognition.hear("milk");
		vi.advanceTimersByTime(SILENCE_TIMEOUT_MS - 1);
		expect(recognition.listening).toBe(true);
		vi.advanceTimersByTime(1);

		expect(recognition.listening).toBe(false);
		expect(handlers.onEnd).toHaveBeenCalledWith("milk");
	});

	it("reports a blocked microphone, and doesn't end normally", () => {
		const { handlers, recognition } = startListening();

		recognition.fail("not-allowed");

		expect(handlers.onError).toHaveBeenCalledWith("not-allowed");
		expect(handlers.onEnd).not.toHaveBeenCalled();
	});

	it("reports any other failure as such", () => {
		const { handlers, recognition } = startListening();

		recognition.fail("audio-capture");

		expect(handlers.onError).toHaveBeenCalledWith("failed");
	});

	it("calls nothing more once aborted", () => {
		const { handlers, session, recognition } = startListening();

		recognition.hear("milk");
		session?.abort();

		expect(recognition.listening).toBe(false);
		expect(handlers.onEnd).not.toHaveBeenCalled();
		expect(handlers.onError).not.toHaveBeenCalled();
	});
});
