import { z } from "zod";

/** Languages the API transcribes: the apps' locales, as ISO 639-1 codes. */
export const transcriptionLanguageSchema = z.enum(["en", "fr", "es"]);

export type TranscriptionLanguage = z.infer<typeof transcriptionLanguageSchema>;

/** Query of `POST /transcriptions`, whose body is the recording itself. */
export const transcriptionQuerySchema = z.strictObject({
	language: transcriptionLanguageSchema,
});

export type TranscriptionQuery = z.infer<typeof transcriptionQuerySchema>;

export const transcriptionSchema = z.object({
	/** What was said, maybe empty. */
	text: z.string(),
});

export type Transcription = z.infer<typeof transcriptionSchema>;

/** Error code: the API has no transcription service configured (503). */
export const TRANSCRIPTION_UNAVAILABLE = "transcription_unavailable";
