import { afterEach, vi } from "vitest";

/**
 * Stands for the browser's speech recognizer: the test says what was heard
 * (`hear()`), when it fails (`fail()`). Installed by `installSpeechRecognition()`.
 */
export class FakeSpeechRecognition {
	static instances: FakeSpeechRecognition[] = [];

	/** The recognizer created last. */
	static latest(): FakeSpeechRecognition {
		const latest = FakeSpeechRecognition.instances.at(-1);
		if (!latest) {
			throw new Error("No speech recognition started");
		}
		return latest;
	}

	lang = "";
	continuous = false;
	interimResults = false;
	listening = false;
	onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
	onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
	onend: (() => void) | null = null;

	constructor() {
		FakeSpeechRecognition.instances.push(this);
	}

	start() {
		this.listening = true;
	}

	stop() {
		this.end();
	}

	abort() {
		if (this.listening) {
			this.onerror?.({ error: "aborted" } as SpeechRecognitionErrorEvent);
		}
		this.end();
	}

	/** The browser heard these results so far, one string each. */
	hear(...transcripts: string[]) {
		this.onresult?.({
			results: transcripts.map((transcript) => [{ transcript }]),
		} as unknown as SpeechRecognitionEvent);
	}

	/** The browser fails with this error code ("not-allowed"...), then ends. */
	fail(error: string) {
		this.onerror?.({ error } as SpeechRecognitionErrorEvent);
		this.end();
	}

	private end() {
		if (this.listening) {
			this.listening = false;
			this.onend?.();
		}
	}
}

/** Gives the browser speech recognition until the end of the test. */
export function installSpeechRecognition(): void {
	vi.stubGlobal("webkitSpeechRecognition", FakeSpeechRecognition);
}

afterEach(() => {
	FakeSpeechRecognition.instances = [];
	vi.unstubAllGlobals();
});
