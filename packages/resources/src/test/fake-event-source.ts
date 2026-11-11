type Listener = (event: MessageEvent) => void;

/** An EventSource the test drives: `emit()` an event, `fail()` the connection. */
export class FakeEventSource {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSED = 2;
	readonly CONNECTING = 0;
	readonly OPEN = 1;
	readonly CLOSED = 2;

	/** Every source opened, the latest last. */
	static instances: FakeEventSource[] = [];

	readonly url: string;
	readonly withCredentials: boolean;
	readyState = FakeEventSource.CONNECTING;
	private readonly listeners = new Map<string, Listener[]>();

	constructor(url: string, init?: EventSourceInit) {
		this.url = url;
		this.withCredentials = init?.withCredentials ?? false;
		FakeEventSource.instances.push(this);
	}

	static latest(): FakeEventSource {
		const source = FakeEventSource.instances.at(-1);
		if (!source) {
			throw new Error("No EventSource was opened");
		}
		return source;
	}

	addEventListener(type: string, listener: Listener): void {
		this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
	}

	close(): void {
		this.readyState = FakeEventSource.CLOSED;
	}

	/** The server sends an event; `data` is serialized like the API does. */
	emit(type: string, data: unknown): void {
		this.readyState = FakeEventSource.OPEN;
		const message = new MessageEvent(type, {
			data: typeof data === "string" ? data : JSON.stringify(data),
		});
		for (const listener of this.listeners.get(type) ?? []) {
			listener(message);
		}
	}

	/** The connection drops; `closed` when the browser gives up reconnecting. */
	fail({ closed = false } = {}): void {
		this.readyState = closed
			? FakeEventSource.CLOSED
			: FakeEventSource.CONNECTING;
		for (const listener of this.listeners.get("error") ?? []) {
			listener(new MessageEvent("error"));
		}
	}
}
