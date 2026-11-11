import { afterEach, describe, expect, it, vi } from "vitest";
import { createApi } from "../index";
import { FakeEventSource } from "../test/fake-event-source";
import { item, listId } from "../test/fixtures";

const actorId = "5f1b7c2e-8d4a-4e6b-9c3f-1a2b3c4d5e6f";

function subscribe(credentials?: RequestCredentials) {
	const api = createApi({
		baseUrl: "http://api.test",
		credentials,
		EventSource: FakeEventSource as unknown as typeof EventSource,
	});
	const handlers = {
		onReady: vi.fn(),
		onEvent: vi.fn(),
		onConnectionChange: vi.fn(),
	};
	const unsubscribe = api.lists.subscribe(listId, handlers);
	return { handlers, unsubscribe, source: FakeEventSource.latest() };
}

afterEach(() => {
	FakeEventSource.instances = [];
});

describe("lists.subscribe", () => {
	it("opens the list's stream with the session cookie", () => {
		const { source } = subscribe("include");

		expect(source.url).toBe(`http://api.test/v1/lists/${listId}/events`);
		expect(source.withCredentials).toBe(true);
	});

	it("reports the connection, then each event validated by the shared schema", () => {
		const { handlers, source } = subscribe();
		expect(handlers.onConnectionChange).toHaveBeenLastCalledWith("connecting");

		source.emit("ready", { listId });
		const event = { type: "items.created", listId, actorId, items: [item] };
		source.emit("items.created", event);

		expect(handlers.onConnectionChange).toHaveBeenLastCalledWith("open");
		expect(handlers.onReady).toHaveBeenCalledOnce();
		expect(handlers.onEvent).toHaveBeenCalledWith(event);
	});

	it("ignores events outside the contract", () => {
		const { handlers, source } = subscribe();

		source.emit("item.deleted", { type: "item.deleted", listId });
		source.emit("item.deleted", "not json");
		source.emit("item.deleted", {
			type: "list.deleted",
			listId,
			actorId,
		});

		expect(handlers.onEvent).not.toHaveBeenCalled();
	});

	it("reports a reconnection, then a closed stream", () => {
		const { handlers, source } = subscribe();

		source.fail();
		expect(handlers.onConnectionChange).toHaveBeenLastCalledWith(
			"reconnecting",
		);
		source.emit("ready", { listId });
		expect(handlers.onReady).toHaveBeenCalledOnce();

		source.fail({ closed: true });
		expect(handlers.onConnectionChange).toHaveBeenLastCalledWith("closed");
	});

	it("stops listening", () => {
		const { unsubscribe, source } = subscribe();

		unsubscribe();

		expect(source.readyState).toBe(FakeEventSource.CLOSED);
	});

	it("needs an EventSource, which only browsers have", () => {
		const api = createApi({ baseUrl: "http://api.test" });
		vi.stubGlobal("EventSource", undefined);

		expect(() => api.lists.subscribe(listId, { onEvent: vi.fn() })).toThrow(
			/only available in the browser/,
		);
		vi.unstubAllGlobals();
	});
});
