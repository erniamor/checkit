import { recordedSpeechInput } from "@/features/voice/recorded-speech-input";
import { webSpeechInput } from "@/features/voice/web-speech-input";
import { getApi } from "@/lib/api";

/** Why listening stopped without a result. */
export type SpeechInputError =
	| "not-allowed"
	| "no-speech"
	| "network"
	/** The API has no transcription service. */
	| "unavailable"
	/** The user reached the API's transcription limit. */
	| "too-many"
	| "failed";

export interface SpeechInputHandlers {
	/** Everything heard so far; may still change until the end. */
	onText: (text: string) => void;
	/** Listening is over and the recording is being transcribed. */
	onTranscribing: () => void;
	/** Listening ended normally: `text` is everything heard, maybe empty. */
	onEnd: (text: string) => void;
	/** Listening failed: `onEnd` isn't called. */
	onError: (error: SpeechInputError) => void;
}

export interface SpeechSession {
	/** Stops listening and keeps what was heard (`onEnd`). */
	stop: () => void;
	/** Stops listening and drops what was heard: no handler is called again. */
	abort: () => void;
}

/**
 * Turns the user's voice into text. Every way of doing it (the browser's
 * recognition, the API's transcription) implements this interface.
 */
export interface SpeechInput {
	/** Starts listening, in a BCP 47 language such as "fr-CA". */
	start: (language: string, handlers: SpeechInputHandlers) => SpeechSession;
}

/**
 * Starts with `primary`, and switches to `fallback` when `primary` can't reach
 * its service before hearing anything: some Chromium browsers (Brave) have
 * the Web Speech API without Google's service behind it.
 */
export function withFallback(
	primary: SpeechInput,
	fallback: SpeechInput,
	win: Window,
): SpeechInput {
	return {
		start(language, handlers) {
			let heard = false;
			let current: SpeechSession | undefined;
			const session = primary.start(language, {
				...handlers,
				onText(text) {
					heard = true;
					handlers.onText(text);
				},
				onError(error) {
					// Offline, the fallback can't reach the API either
					if (error === "network" && !heard && win.navigator.onLine) {
						current = fallback.start(language, handlers);
						return;
					}
					handlers.onError(error);
				},
			});
			current ??= session;
			return {
				stop: () => current?.stop(),
				abort: () => current?.abort(),
			};
		},
	};
}

/**
 * The way to recognize speech in this browser: its own recognition, else a
 * recording transcribed by the API. Undefined when it can do neither.
 */
export function getSpeechInput(win: Window): SpeechInput | undefined {
	const browser = webSpeechInput(win);
	const recorded = recordedSpeechInput(win, (audio, language) =>
		getApi().transcriptions.create(audio, { language }),
	);
	return browser && recorded
		? withFallback(browser, recorded, win)
		: (browser ?? recorded);
}
