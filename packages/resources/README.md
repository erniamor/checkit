# @repo/resources

Typed client of the Checkit API for the front ends. Each resource groups the operations of one domain; inputs are validated with [`@repo/schemas`](../schemas) before sending, responses are validated against their schema, and failures come back as typed errors.

## Usage

```ts
import { createApi, UnauthorizedError, ValidationError } from "@repo/resources";

const api = createApi({
	baseUrl: "http://localhost:3001", // without /v1
	credentials: "include", // in the browser: sends the session cookie
	headers: () => ({ "Accept-Language": "fr" }), // read at every request
});

try {
	const me = await api.me.get();
} catch (error) {
	if (error instanceof UnauthorizedError) {
		// not signed in
	}
}
```

During server rendering, pass the incoming request's cookie in `headers` instead of `credentials` (see `apps/www/src/lib/api.ts`).

## Resources

| Resource | Operations |
| --- | --- |
| `auth` | `sendMagicLink({ email, callbackURL })`, `sendSignInCode({ email })`, `signInWithCode({ email, code })`, `signOut()` |
| `me` | `get()`, `update({ name })` |
| `lists` | `list({ page?, pageSize? })`, `get(listId)`, `create({ name, kind? })`, `update(listId, { name?, kind? })`, `remove(listId)`, `subscribe(listId, handlers)` |
| `members` | `list(listId)`, `updateRole(listId, userId, { role })`, `remove(listId, userId)`, `leave(listId)` |
| `invitations` | `list(listId)`, `create(listId, { email, role })`, `revoke(listId, invitationId)`, `preview(token)`, `accept(token)`, and for the signed-in user's own invitations `received()`, `acceptReceived(invitationId)`, `decline(invitationId)` |
| `shareLinks` | `list(listId)`, `create(listId, { role })`, `revoke(listId, linkId)`, `preview(token)`, `join(token)` |
| `transcriptions` | `create(audio, { language })`: sends a recording (a `Blob`, as is, with its type) and returns its text |
| `items` | `list(listId, { page?, pageSize? })`, `listAll({ status?, page?, pageSize? })` (the user's items across all their lists), `add(listId, { label })`, `addMany(listId, { labels })` (returns `{ created, restored, skipped }`), `update(listId, itemId, { label?, done?, position? })`, `updateAll(listId, { done })`, `remove(listId, itemId)` |

Paginated operations return a `Page<T>`: `{ items, page, pageSize, total }`, without the API's `{ data, pagination }` envelope. Identifiers are encoded in the path, so they can't change the requested route.

## Real time

`lists.subscribe(listId, { onReady, onEvent, onConnectionChange })` listens to a list's changes (Server-Sent Events) and returns the function that stops listening. Each event is validated with `listEventSchema` of `@repo/schemas`; an event outside the contract is ignored. `onReady` is called on the first connection and after each reconnection: events missed meanwhile aren't replayed, so reload the list there. `onConnectionChange` reports `"connecting"`, `"open"`, `"reconnecting"` (the browser retries by itself) or `"closed"` (it gave up, e.g. the user lost access).

It needs an `EventSource`, which only browsers have: pass `EventSource` in the configuration to replace it (tests), and don't subscribe during server rendering.

## Errors

| Class | When | Useful fields |
| --- | --- | --- |
| `ValidationError` | Invalid input, caught before sending or answered by the API (400, 422) | `code`, `issues: [{ field, message }]` with error codes from `@repo/schemas` |
| `UnauthorizedError` | 401, no valid session | `code` |
| `ForbiddenError` | 403 | `code` |
| `NotFoundError` | 404 | `code` |
| `RateLimitError` | 429 | `code` |
| `ServerError` | 5xx, or a response that doesn't match its schema (`code: "unexpected_response"`) | `code` |
| `ApiError` | Any other error status (e.g. 409, 410); parent class of all the above | `status`, `code`, `message` |
| `NetworkError` | The API couldn't be reached | `cause` |

Errors of the sign-in routes (handled by Better Auth) are read the same way, with their codes lowercased: a wrong code is a `ValidationError` with the code `invalid_otp`. A cancelled request (`AbortSignal`) rejects with the original `AbortError`.

## Scripts

`pnpm --filter @repo/resources test`, `pnpm --filter @repo/resources typecheck`.
