import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { recognitionLanguage } from "@/features/voice/recognition-language";
import {
	getSpeechInput,
	type SpeechInputError,
	type SpeechSession,
} from "@/features/voice/speech-input";
import { getLocale } from "@/paraglide/runtime";

export type VoiceInputState =
	| { status: "idle" }
	| { status: "listening"; text: string }
	| { status: "heard"; text: string }
	| { status: "error"; error: SpeechInputError };

// Whether the browser can recognize speech doesn't change while the page is open
const subscribeNever = () => () => {};

/**
 * Listens to the user and keeps what was heard. `supported` is false on the
 * server and during hydration: the voice input only shows in the browser.
 */
export function useVoiceInput() {
	const supported = useSyncExternalStore(
		subscribeNever,
		() => getSpeechInput(window) !== undefined,
		() => false,
	);
	const [state, setState] = useState<VoiceInputState>({ status: "idle" });
	const session = useRef<SpeechSession>(undefined);

	// Leaving the page stops the microphone
	useEffect(() => () => session.current?.abort(), []);

	function start() {
		const input = getSpeechInput(window);
		if (!input) {
			return;
		}
		session.current?.abort();
		setState({ status: "listening", text: "" });
		session.current = input.start(
			recognitionLanguage(getLocale(), navigator.languages),
			{
				onText: (text) => setState({ status: "listening", text }),
				onEnd: (text) => {
					session.current = undefined;
					setState(
						text.trim() === ""
							? { status: "error", error: "no-speech" }
							: { status: "heard", text },
					);
				},
				onError: (error) => {
					session.current = undefined;
					setState({ status: "error", error });
				},
			},
		);
	}

	return {
		supported,
		state,
		start,
		/** Stops listening and keeps what was heard. */
		stop: () => session.current?.stop(),
		/** Stops listening, if needed, and forgets what was heard. */
		reset() {
			session.current?.abort();
			session.current = undefined;
			setState({ status: "idle" });
		},
	};
}
