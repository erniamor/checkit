import {
	TRANSCRIPTION_UNAVAILABLE,
	type TranscriptionLanguage,
} from "@repo/schemas";
import { env } from "@/env";
import { AppError } from "@/lib/errors";

export interface Transcriber {
	/** What is said in the recording, in `language`; maybe empty. */
	transcribe(audio: Blob, language: TranscriptionLanguage): Promise<string>;
}

const MISTRAL_URL = "https://api.mistral.ai/v1/audio/transcriptions";
const MISTRAL_MODEL = "voxtral-mini-latest";
const MISTRAL_TIMEOUT_MS = 30_000;

interface MistralOptions {
	apiKey: string;
	fetch?: typeof fetch;
}

function transcriptionFailed(): AppError {
	return new AppError(
		502,
		"transcription_failed",
		"The recording could not be transcribed",
	);
}

// The provider guesses the format from the file name
const extensions: Record<string, string> = {
	"audio/webm": "webm",
	"audio/ogg": "ogg",
	"audio/mp4": "m4a",
	"audio/mpeg": "mp3",
	"audio/wav": "wav",
};

function fileName(type: string): string {
	const base = type.split(";")[0]?.trim().toLowerCase() ?? "";
	return `recording.${extensions[base] ?? "webm"}`;
}

/**
 * Transcribes with Mistral's API (Voxtral). The recording is only sent, never
 * stored nor logged; a failure is logged with Mistral's status only.
 */
export function createMistralTranscriber({
	apiKey,
	fetch: send = fetch,
}: MistralOptions): Transcriber {
	return {
		async transcribe(audio, language) {
			const form = new FormData();
			form.append("model", MISTRAL_MODEL);
			form.append("language", language);
			form.append("file", audio, fileName(audio.type));
			let response: Response;
			try {
				response = await send(MISTRAL_URL, {
					method: "POST",
					headers: { Authorization: `Bearer ${apiKey}` },
					body: form,
					signal: AbortSignal.timeout(MISTRAL_TIMEOUT_MS),
				});
			} catch (error) {
				console.error("[transcription] Mistral could not be reached", error);
				throw transcriptionFailed();
			}
			const body: unknown = await response.json().catch(() => null);
			const text =
				body && typeof body === "object" && "text" in body
					? body.text
					: undefined;
			if (!response.ok || typeof text !== "string") {
				console.error(
					`[transcription] Mistral refused the recording: ${response.status}`,
				);
				throw transcriptionFailed();
			}
			return text;
		},
	};
}

// Without a provider, the route says so: the front end then hides voice input
const unavailableTranscriber: Transcriber = {
	async transcribe() {
		throw new AppError(
			503,
			TRANSCRIPTION_UNAVAILABLE,
			"No transcription service is configured",
		);
	},
};

export const transcriber: Transcriber = env.MISTRAL_API_KEY
	? createMistralTranscriber({ apiKey: env.MISTRAL_API_KEY })
	: unavailableTranscriber;
