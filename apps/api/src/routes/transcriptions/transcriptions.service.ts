import type { Transcription, TranscriptionLanguage } from "@repo/schemas";
import { AppError } from "@/lib/errors";
import { createRateLimiter } from "@/lib/rate-limit";
import { transcriber } from "@/lib/transcriber";

/** Transcriptions per user and hour: each one is paid to the provider. */
export const TRANSCRIPTIONS_PER_HOUR = 30;

const limiter = createRateLimiter({
	limit: TRANSCRIPTIONS_PER_HOUR,
	windowMs: 60 * 60 * 1000,
});

/** Transcribes a user's recording; it's never kept. */
export async function transcribe(
	userId: string,
	audio: Blob,
	language: TranscriptionLanguage,
): Promise<Transcription> {
	if (audio.size === 0) {
		throw new AppError(422, "audio_required", "The recording is empty");
	}
	if (!limiter.take(userId)) {
		throw new AppError(
			429,
			"too_many_transcriptions",
			"Too many transcriptions, try again later",
		);
	}
	const text = await transcriber.transcribe(audio, language);
	return { text: text.trim() };
}
