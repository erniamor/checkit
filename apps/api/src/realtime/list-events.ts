import type { ListEvent } from "@repo/schemas";

type Listener = (event: ListEvent) => void;

/**
 * Delivers list events to the connections listening to that list. The
 * in-memory implementation only reaches connections of this process: with
 * several API instances, replace it with PostgreSQL LISTEN/NOTIFY behind the
 * same interface.
 */
export interface ListEventBus {
	publish(event: ListEvent): void;
	/** Returns the function that stops listening. */
	subscribe(listId: string, listener: Listener): () => void;
	/** Connections of this process listening to the list. */
	listenerCount(listId: string): number;
}

function createInMemoryBus(): ListEventBus {
	const listenersByList = new Map<string, Set<Listener>>();

	return {
		publish(event) {
			for (const listener of listenersByList.get(event.listId) ?? []) {
				try {
					listener(event);
				} catch (error) {
					// A failing connection must not prevent the others from being notified
					console.error(error);
				}
			}
		},
		subscribe(listId, listener) {
			const listeners = listenersByList.get(listId) ?? new Set();
			listeners.add(listener);
			listenersByList.set(listId, listeners);
			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) {
					listenersByList.delete(listId);
				}
			};
		},
		listenerCount(listId) {
			return listenersByList.get(listId)?.size ?? 0;
		},
	};
}

export const listEvents: ListEventBus = createInMemoryBus();

/** Whether the event takes the list away from the user listening to it. */
export function endsAccess(event: ListEvent, userId: string): boolean {
	return (
		event.type === "list.deleted" ||
		(event.type === "member.removed" && event.userId === userId)
	);
}
