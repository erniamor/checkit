import type { z } from "zod";
import { toApiError, toInputError } from "../api/errors";
import { NetworkError, ServerError } from "../errors";

export interface ApiClientConfig {
	/** URL of the API, without the version, e.g. "http://localhost:3001". */
	baseUrl: string;
	/**
	 * Headers added to every request, read at each call: the session cookie
	 * forwarded during server rendering, the user's language...
	 */
	headers?: () => Record<string, string | undefined>;
	/** "include" in the browser, so the session cookie is sent to the API. */
	credentials?: RequestCredentials;
	/** Replaces the global fetch, e.g. in tests. */
	fetch?: typeof fetch;
	/**
	 * Replaces the global EventSource, used by real-time subscriptions. Only
	 * browsers have one: subscriptions don't work during server rendering.
	 */
	EventSource?: typeof EventSource;
}

interface RequestOptions<Output> {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	/** Path under /v1, e.g. "/me". */
	path: string;
	body?: unknown;
	/** Schema of the response; omit for responses with no useful body. */
	response?: z.ZodType<Output>;
	signal?: AbortSignal;
}

export interface ApiClient {
	request<Output = void>(options: RequestOptions<Output>): Promise<Output>;
	/** Opens a Server-Sent Events stream under /v1, with the session cookie in the browser. */
	openEventSource(path: string): EventSource;
}

/** Validates an input before sending it: invalid input throws a ValidationError. */
export function parseInput<Schema extends z.ZodType>(
	schema: Schema,
	input: unknown,
): z.output<Schema> {
	const result = schema.safeParse(input);
	if (!result.success) {
		throw toInputError(result.error);
	}
	return result.data;
}

function isAbort(error: unknown): boolean {
	return error instanceof Error && error.name === "AbortError";
}

export function createApiClient(config: ApiClientConfig): ApiClient {
	const doFetch = config.fetch ?? globalThis.fetch;

	return {
		async request<Output>({
			method = "GET",
			path,
			body,
			response: responseSchema,
			signal,
		}: RequestOptions<Output>): Promise<Output> {
			const headers: Record<string, string> = { Accept: "application/json" };
			for (const [name, value] of Object.entries(config.headers?.() ?? {})) {
				if (value !== undefined) {
					headers[name] = value;
				}
			}
			if (body !== undefined) {
				headers["Content-Type"] = "application/json";
			}

			let response: Response;
			try {
				response = await doFetch(`${config.baseUrl}/v1${path}`, {
					method,
					headers,
					body: body === undefined ? undefined : JSON.stringify(body),
					credentials: config.credentials,
					signal,
				});
			} catch (error) {
				// A cancellation is the caller's decision, not a network failure
				if (isAbort(error)) {
					throw error;
				}
				throw new NetworkError(error);
			}

			const json: unknown =
				response.status === 204
					? undefined
					: await response.json().catch(() => undefined);
			if (!response.ok) {
				throw toApiError(response.status, json);
			}
			if (!responseSchema) {
				return undefined as Output;
			}
			const parsed = responseSchema.safeParse(json);
			if (!parsed.success) {
				throw new ServerError(
					response.status,
					"unexpected_response",
					`Unexpected response from ${method} ${path}`,
				);
			}
			return parsed.data;
		},

		openEventSource(path: string): EventSource {
			const EventSourceClass = config.EventSource ?? globalThis.EventSource;
			if (!EventSourceClass) {
				throw new Error("EventSource is only available in the browser");
			}
			return new EventSourceClass(`${config.baseUrl}/v1${path}`, {
				withCredentials: config.credentials === "include",
			});
		},
	};
}
