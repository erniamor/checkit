import {
	LIST_EVENTS_READY,
	type ListEvent,
	listEventSchema,
} from "@repo/schemas";
import { segment } from "../api/page";
import type { ApiClient } from "../http/client";

export type ConnectionState = "connecting" | "open" | "reconnecting" | "closed";

export interface ListEventHandlers {
	/**
	 * The stream listens: on the first connection, and after each reconnection.
	 * Events missed while disconnected aren't replayed: reload the list here.
	 */
	onReady?: () => void;
	/** A change of the list, validated against the shared schema. */
	onEvent: (event: ListEvent) => void;
	onConnectionChange?: (state: ConnectionState) => void;
}

const eventTypes = listEventSchema.options.map(
	(option) => option.shape.type.value,
);

/**
 * Listens to a list's changes (Server-Sent Events). The browser reconnects by
 * itself after a disconnection. Returns the function that stops listening.
 */
export function subscribeToList(
	client: ApiClient,
	listId: string,
	{ onReady, onEvent, onConnectionChange }: ListEventHandlers,
): () => void {
	const source = client.openEventSource(`/lists/${segment(listId)}/events`);
	onConnectionChange?.("connecting");

	source.addEventListener(LIST_EVENTS_READY, () => {
		onConnectionChange?.("open");
		onReady?.();
	});
	for (const type of eventTypes) {
		source.addEventListener(type, (message) => {
			let data: unknown;
			try {
				data = JSON.parse(message.data);
			} catch {
				return;
			}
			// An event outside the contract is ignored rather than breaking the page
			const event = listEventSchema.safeParse(data);
			if (event.success && event.data.type === type) {
				onEvent(event.data);
			}
		});
	}
	source.addEventListener("error", () => {
		// CLOSED: the server refused the stream (e.g. no longer a member) and the
		// browser gives up; otherwise it is reconnecting
		onConnectionChange?.(
			source.readyState === source.CLOSED ? "closed" : "reconnecting",
		);
	});

	return () => {
		source.close();
	};
}
