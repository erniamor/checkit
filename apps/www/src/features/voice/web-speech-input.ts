import type {
	SpeechInput,
	SpeechInputError,
} from "@/features/voice/speech-input";

// The Web Speech API's recognizer: lib.dom has its events, not the class itself
interface SpeechRecognitionLike {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
	onend: (() => void) | null;
	start: () => void;
	stop: () => void;
	abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

/** Listening stops after this long without hearing anything new. */
export const SILENCE_TIMEOUT_MS = 4000;

function recognitionConstructor(
	win: Window,
): SpeechRecognitionConstructor | undefined {
	const speechWindow = win as Window & {
		SpeechRecognition?: SpeechRecognitionConstructor;
		// Chrome and Safari only have the prefixed name
		webkitSpeechRecognition?: SpeechRecognitionConstructor;
	};
	return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function toSpeechInputError(error: string): SpeechInputError {
	switch (error) {
		case "not-allowed":
		case "service-not-allowed":
			return "not-allowed";
		case "no-speech":
			return "no-speech";
		case "network":
			return "network";
		default:
			return "failed";
	}
}

/**
 * Speech recognition by the browser (Chrome, Edge, Safari), which sends the
 * audio to its own service. Undefined where the browser has none (Firefox).
 */
export function webSpeechInput(win: Window): SpeechInput | undefined {
	const Recognition = recognitionConstructor(win);
	if (!Recognition) {
		return undefined;
	}
	return {
		start(language, { onText, onEnd, onError }) {
			const recognition = new Recognition();
			recognition.lang = language;
			// Keeps listening through the pauses between items
			recognition.continuous = true;
			recognition.interimResults = true;
			let text = "";
			let finished = false;
			let silence: ReturnType<typeof setTimeout> | undefined;
			const waitForSilence = () => {
				clearTimeout(silence);
				silence = setTimeout(() => recognition.stop(), SILENCE_TIMEOUT_MS);
			};

			recognition.onresult = (event) => {
				text = Array.from(event.results, (result) => result[0]?.transcript)
					.join(" ")
					.replace(/\s+/g, " ")
					.trim();
				onText(text);
				waitForSilence();
			};
			recognition.onerror = (event) => {
				// "aborted" follows abort(): the caller already left
				if (finished || event.error === "aborted") {
					return;
				}
				finished = true;
				clearTimeout(silence);
				onError(toSpeechInputError(event.error));
			};
			recognition.onend = () => {
				clearTimeout(silence);
				if (!finished) {
					finished = true;
					onEnd(text);
				}
			};

			try {
				recognition.start();
				waitForSilence();
			} catch {
				finished = true;
				onError("failed");
			}

			return {
				stop: () => recognition.stop(),
				abort() {
					finished = true;
					clearTimeout(silence);
					recognition.abort();
				},
			};
		},
	};
}
