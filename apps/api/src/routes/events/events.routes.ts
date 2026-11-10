import { LIST_EVENTS_READY, type ListEvent } from "@repo/schemas";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import {
	type ListAccessVariables,
	requireListRole,
} from "@/middlewares/require-list-role";
import { endsAccess, listEvents } from "@/realtime/list-events";

/** Keeps idle connections open through proxies that close silent ones. */
const HEARTBEAT_INTERVAL_MS = 25_000;

// Mounted on /lists/:listId/events, behind requireAuth: a Server-Sent Events
// stream of the list's changes
export const listEventsRoutes = new Hono<{
	Variables: ListAccessVariables;
}>().get("/", requireListRole("viewer"), (c) => {
	const listId = c.get("listId");
	const userId = c.get("user").id;

	return streamSSE(c, async (stream) => {
		// Writes one message at a time, in the order the events arrive
		let pending = Promise.resolve();
		const send = (write: () => Promise<unknown>) => {
			pending = pending.then(write).then(
				() => undefined,
				() => undefined,
			);
			return pending;
		};

		let endStream = () => {};
		const ended = new Promise<void>((resolve) => {
			endStream = resolve;
		});
		stream.onAbort(endStream);

		const unsubscribe = listEvents.subscribe(listId, (event: ListEvent) => {
			send(() =>
				stream.writeSSE({ event: event.type, data: JSON.stringify(event) }),
			);
			if (endsAccess(event, userId)) {
				send(async () => endStream());
			}
		});
		const heartbeat = setInterval(() => {
			send(() => stream.write(": heartbeat\n\n"));
		}, HEARTBEAT_INTERVAL_MS);

		try {
			// Sent after subscribing: no event is lost between the two
			await send(() =>
				stream.writeSSE({
					event: LIST_EVENTS_READY,
					data: JSON.stringify({ listId }),
				}),
			);
			await ended;
		} finally {
			clearInterval(heartbeat);
			unsubscribe();
		}
	});
});
