import { type ListEvent, listEventSchema } from "@repo/schemas";
import { api } from "@test/helpers/api";

const READ_TIMEOUT_MS = 2000;

interface SseMessage {
	event: string;
	data: string;
}

export interface EventStream {
	response: Response;
	/** Next message, heartbeats skipped; null once the server ended the stream. */
	nextMessage(): Promise<SseMessage | null>;
	/** Next list event, checked against the shared schema. */
	nextEvent(): Promise<ListEvent>;
	/** Closes the connection, as a browser leaving the page. */
	close(): Promise<void>;
}

function parse(block: string): SseMessage | null {
	let event = "message";
	const data: string[] = [];
	for (const line of block.split("\n")) {
		if (line.startsWith("event:")) {
			event = line.slice(6).trim();
		} else if (line.startsWith("data:")) {
			data.push(line.slice(5).trimStart());
		}
	}
	// A block with no data is a comment, e.g. a heartbeat
	return data.length > 0 ? { event, data: data.join("\n") } : null;
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(
				() => reject(new Error("No SSE message received in time")),
				READ_TIMEOUT_MS,
			),
		),
	]);
}

/** Opens the list's event stream as the given user. */
export async function openEventStream(
	listId: string,
	cookie?: string,
): Promise<EventStream> {
	const response = await api(`/v1/lists/${listId}/events`, { cookie });
	const reader = response.body?.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	async function nextMessage(): Promise<SseMessage | null> {
		if (!reader) {
			return null;
		}
		for (;;) {
			const end = buffer.indexOf("\n\n");
			if (end !== -1) {
				const message = parse(buffer.slice(0, end));
				buffer = buffer.slice(end + 2);
				if (message) {
					return message;
				}
				continue;
			}
			const { done, value } = await withTimeout(reader.read());
			if (done) {
				return null;
			}
			buffer += decoder.decode(value, { stream: true });
		}
	}

	return {
		response,
		nextMessage,
		async nextEvent() {
			const message = await nextMessage();
			if (!message) {
				throw new Error("The event stream ended");
			}
			const event = listEventSchema.parse(JSON.parse(message.data));
			if (event.type !== message.event) {
				throw new Error(`SSE event ${message.event} carries ${event.type}`);
			}
			return event;
		},
		async close() {
			await reader?.cancel();
		},
	};
}
