import {
	type TranscriptionQuery,
	transcriptionQuerySchema,
	transcriptionSchema,
} from "@repo/schemas";
import { type ApiClient, parseInput } from "../http/client";

/** Speech to text, by the API's transcription service. */
export function createTranscriptionsResource(client: ApiClient) {
	return {
		/**
		 * Transcribes a recording (a Blob with its audio type). Throws a
		 * ServerError with the code `transcription_unavailable` when the API has
		 * no transcription service.
		 */
		async create(audio: Blob, query: TranscriptionQuery): Promise<string> {
			const { language } = parseInput(transcriptionQuerySchema, query);
			const { text } = await client.request({
				method: "POST",
				path: `/transcriptions?language=${language}`,
				body: audio,
				response: transcriptionSchema,
			});
			return text;
		},
	};
}

export type TranscriptionsResource = ReturnType<
	typeof createTranscriptionsResource
>;
