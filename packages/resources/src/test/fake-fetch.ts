import { vi } from "vitest";
import { createApi } from "../index";

export interface SentRequest {
	url: string;
	method: string;
	headers: Record<string, string>;
	/** Parsed JSON, or the Blob sent as is. */
	body: unknown;
	credentials: RequestCredentials | undefined;
}

/** A fetch answering `status` and `body`, recording the requests it receives. */
export function fakeFetch(status: number, body?: unknown) {
	const requests: SentRequest[] = [];
	const fetch = vi.fn(
		async (url: string | URL | Request, init?: RequestInit) => {
			requests.push({
				url: String(url),
				method: init?.method ?? "GET",
				headers: Object.fromEntries(new Headers(init?.headers).entries()),
				body:
					typeof init?.body === "string"
						? JSON.parse(init.body)
						: init?.body instanceof Blob
							? init.body
							: undefined,
				credentials: init?.credentials,
			});
			return new Response(
				status === 204 || body === undefined ? null : JSON.stringify(body),
				{ status, headers: { "Content-Type": "application/json" } },
			);
		},
	);
	return { fetch, requests };
}

/** The API's resources on top of a fake fetch. */
export function fakeApi(status: number, body?: unknown) {
	const { fetch, requests } = fakeFetch(status, body);
	const api = createApi({
		baseUrl: "http://api.test",
		fetch,
		headers: () => ({ "Accept-Language": "fr" }),
	});
	return { api, requests, fetch };
}
