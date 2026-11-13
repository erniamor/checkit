import { createApi } from "@repo/resources";
import { vi } from "vitest";
import { getApi } from "@/lib/api";
import { FakeEventSource } from "@/test/fake-event-source";

export interface ApiRequest {
	method: string;
	/** Path under /v1, e.g. "/me". */
	path: string;
	body: unknown;
}

export interface ApiResponse {
	status: number;
	body?: unknown;
}

type Respond = (
	request: ApiRequest,
	/** The full URL, e.g. to read the query string. */
	url: URL,
) => ApiResponse | undefined | Promise<ApiResponse | undefined>;

/**
 * Answers the app's API calls with `respond`, at the network level: the real
 * @repo/resources client runs on top. Requires `vi.mock("@/lib/api")` in the
 * test file. Returns the requests received. Real-time streams use a
 * FakeEventSource.
 */
export function mockApi(respond: Respond): ApiRequest[] {
	const requests: ApiRequest[] = [];
	const api = createApi({
		baseUrl: "http://api.test",
		// Real-time streams are driven by the test through FakeEventSource.latest()
		EventSource: FakeEventSource as unknown as typeof EventSource,
		fetch: async (url, init) => {
			const fullUrl = new URL(String(url));
			const request: ApiRequest = {
				method: init?.method ?? "GET",
				path: fullUrl.pathname.replace(/^\/v1/, ""),
				body:
					typeof init?.body === "string"
						? JSON.parse(init.body)
						: init?.body instanceof Blob
							? init.body
							: undefined,
			};
			requests.push(request);
			const response = (await respond(request, fullUrl)) ?? {
				status: 404,
				body: { error: { code: "not_found", message: "Route not found" } },
			};
			return new Response(
				response.body === undefined ? null : JSON.stringify(response.body),
				{
					status: response.status,
					headers: { "Content-Type": "application/json" },
				},
			);
		},
	});
	vi.mocked(getApi).mockReturnValue(api);
	return requests;
}

export const aliceProfile = {
	id: "5f1b7c2e-8d4a-4e6b-9c3f-1a2b3c4d5e6f",
	email: "alice@example.com",
	name: "Alice",
	image: null,
};
