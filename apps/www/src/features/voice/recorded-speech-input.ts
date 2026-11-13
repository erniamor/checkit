import { ApiError, NetworkError, RateLimitError } from "@repo/resources";
import {
	TRANSCRIPTION_UNAVAILABLE,
	type TranscriptionLanguage,
	transcriptionLanguageSchema,
} from "@repo/schemas";
import type {
	SpeechInput,
	SpeechInputError,
} from "@/features/voice/speech-input";

/** Recording stops by itself after this long: the API takes 1 MB at most. */
export const MAX_RECORDING_MS = 30_000;
// Enough for speech: 30 seconds weigh about 120 KB
const AUDIO_BITS_PER_SECOND = 32_000;

type Transcribe = (
	audio: Blob,
	language: TranscriptionLanguage,
) => Promise<string>;

function toSpeechInputError(error: unknown): SpeechInputError {
	if (error instanceof NetworkError) {
		return "network";
	}
	if (error instanceof RateLimitError) {
		return "too-many";
	}
	if (error instanceof ApiError && error.code === TRANSCRIPTION_UNAVAILABLE) {
		return "unavailable";
	}
	return "failed";
}

/** "fr-CA" is transcribed as "fr". */
function transcriptionLanguage(language: string): TranscriptionLanguage {
	return transcriptionLanguageSchema
		.catch("en")
		.parse(language.split("-")[0]?.toLowerCase());
}

/**
 * Records the microphone, then has the recording transcribed (by the API):
 * nothing shows while the user speaks, and they say when they're done.
 * Undefined where the browser can't record.
 */
export function recordedSpeechInput(
	win: Window,
	transcribe: Transcribe,
): SpeechInput | undefined {
	const devices = win.navigator.mediaDevices;
	const BrowserRecorder = (
		win as Window & { MediaRecorder?: typeof MediaRecorder }
	).MediaRecorder;
	if (!BrowserRecorder || !devices?.getUserMedia) {
		return undefined;
	}
	const Recorder = BrowserRecorder;
	return {
		start(language, { onTranscribing, onEnd, onError }) {
			let recorder: MediaRecorder | undefined;
			let stopRequested = false;
			let aborted = false;
			let limit: ReturnType<typeof setTimeout> | undefined;
			const stopRecording = () => {
				clearTimeout(limit);
				if (recorder?.state === "recording") {
					recorder.stop();
				}
			};

			function record(stream: MediaStream) {
				const chunks: Blob[] = [];
				const active = new Recorder(stream, {
					audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
				});
				active.ondataavailable = (event) => {
					if (event.data.size > 0) {
						chunks.push(event.data);
					}
				};
				active.onstop = () => {
					// Turns the browser's microphone indicator off
					for (const track of stream.getTracks()) {
						track.stop();
					}
					if (aborted) {
						return;
					}
					const audio = new Blob(chunks, {
						type: active.mimeType || chunks[0]?.type,
					});
					if (audio.size === 0) {
						onEnd("");
						return;
					}
					onTranscribing();
					transcribe(audio, transcriptionLanguage(language)).then(
						(text) => !aborted && onEnd(text),
						(error: unknown) => !aborted && onError(toSpeechInputError(error)),
					);
				};
				recorder = active;
				active.start();
				limit = setTimeout(stopRecording, MAX_RECORDING_MS);
				if (stopRequested) {
					stopRecording();
				}
			}

			devices.getUserMedia({ audio: true }).then(
				(stream) => {
					if (aborted) {
						for (const track of stream.getTracks()) {
							track.stop();
						}
						return;
					}
					record(stream);
				},
				(error: unknown) => {
					if (!aborted) {
						onError(
							// A DOMException, which isn't an Error everywhere
							(error as { name?: unknown } | null)?.name === "NotAllowedError"
								? "not-allowed"
								: "failed",
						);
					}
				},
			);

			return {
				stop() {
					stopRequested = true;
					stopRecording();
				},
				abort() {
					aborted = true;
					stopRecording();
				},
			};
		},
	};
}
