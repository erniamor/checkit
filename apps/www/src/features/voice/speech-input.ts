import { webSpeechInput } from "@/features/voice/web-speech-input";

/** Why listening stopped without a result. */
export type SpeechInputError =
	| "not-allowed"
	| "no-speech"
	| "network"
	| "failed";

export interface SpeechInputHandlers {
	/** Everything heard so far; may still change until the end. */
	onText: (text: string) => void;
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

/** The way to recognize speech in this browser, if there is one. */
export function getSpeechInput(win: Window): SpeechInput | undefined {
	return webSpeechInput(win);
}
