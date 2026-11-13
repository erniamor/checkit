import { describe, expect, it, vi } from "vitest";
import {
	type SpeechInput,
	type SpeechInputHandlers,
	withFallback,
} from "@/features/voice/speech-input";

/** A SpeechInput whose handlers the test calls itself. */
function controlledInput() {
	let handlers: SpeechInputHandlers | undefined;
	const session = { stop: vi.fn(), abort: vi.fn() };
	const input: SpeechInput = {
		start: vi.fn((_language, given) => {
			handlers = given;
			return session;
		}),
	};
	return {
		input,
		session,
		handlers: () => {
			if (!handlers) {
				throw new Error("Not started");
			}
			return handlers;
		},
	};
}

function listeners() {
	return {
		onText: vi.fn(),
		onTranscribing: vi.fn(),
		onEnd: vi.fn(),
		onError: vi.fn(),
	};
}

describe("withFallback", () => {
	it("switches to the fallback when the browser's service can't be reached", () => {
		const primary = controlledInput();
		const fallback = controlledInput();
		const given = listeners();
		const session = withFallback(primary.input, fallback.input, window).start(
			"fr-FR",
			given,
		);

		primary.handlers().onError("network");
		session.stop();

		expect(fallback.input.start).toHaveBeenCalledWith("fr-FR", given);
		expect(fallback.session.stop).toHaveBeenCalled();
		expect(given.onError).not.toHaveBeenCalled();
	});

	it("keeps the error once something was heard, or for another error", () => {
		const primary = controlledInput();
		const fallback = controlledInput();
		const given = listeners();
		withFallback(primary.input, fallback.input, window).start("en-US", given);

		primary.handlers().onText("milk");
		primary.handlers().onError("network");

		expect(given.onText).toHaveBeenCalledWith("milk");
		expect(given.onError).toHaveBeenCalledWith("network");
		expect(fallback.input.start).not.toHaveBeenCalled();
	});

	it("keeps the network error when offline", () => {
		vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
		const primary = controlledInput();
		const fallback = controlledInput();
		const given = listeners();
		withFallback(primary.input, fallback.input, window).start("en-US", given);

		primary.handlers().onError("network");

		expect(given.onError).toHaveBeenCalledWith("network");
		expect(fallback.input.start).not.toHaveBeenCalled();
		vi.restoreAllMocks();
	});
});
