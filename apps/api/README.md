# api

Checkit's REST API: accounts and passwordless sign-in, to-do lists, their items and members. Built with Hono on Node 24, Drizzle ORM on PostgreSQL 17 and Better Auth.

## Setup

Docker must be running.

```sh
cp .env.example .env        # then fill in BETTER_AUTH_SECRET
pnpm --filter api db:up      # PostgreSQL on localhost:5433
pnpm --filter api db:migrate
pnpm --filter api dev        # http://localhost:3001
```

The database container holds two databases: `checkit` for development and `checkit_test` for the tests. It listens on port 5433 to avoid clashing with another local PostgreSQL on 5432.

## Environment variables

Validated at startup by [`src/env.ts`](src/env.ts): the API refuses to start with an invalid value.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | no | `development` (default), `test` or `production` |
| `PORT` | no | Listening port, `3001` by default |
| `API_URL` | yes | Public URL of the API, used in sign-in links and OAuth callbacks |
| `APP_URL` | yes | Public URL of the front end, used in invitation links (`<APP_URL>/invitations/<token>`) |
| `DATABASE_URL` | yes | PostgreSQL connection URL |
| `CORS_ORIGINS` | yes | Comma-separated front-end origins allowed to call the API (with cookies) |
| `BETTER_AUTH_SECRET` | yes | At least 32 characters; signs sessions and tokens |
| `RESEND_API_KEY`, `EMAIL_FROM` | in production | Send the emails with [Resend](https://resend.com); both or none. `EMAIL_FROM` is `Name <address>` or `address`, on a domain verified in Resend. Without them (development, tests), emails are printed to the console |
| `COOKIE_DOMAIN` | in production | Parent domain of the API and the front end (e.g. `checkit.example.com` for `api.checkit.example.com` and `checkit.example.com`): the session cookie is shared with the front end's server. `API_URL` and `APP_URL` must be under it. Unset in development |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no | Enable Google sign-in; both or none. Redirect URI: `<API_URL>/v1/auth/callback/google` |

## Scripts

| Script | Effect |
| --- | --- |
| `dev` | Development server with reload (`tsx watch`) |
| `build` / `start` | Bundle to `dist/index.mjs` with tsdown / run it |
| `db:up` / `db:down` | Start / stop the local PostgreSQL |
| `db:generate` | Generate a SQL migration from the Drizzle schema (`src/db/schema/`) into `drizzle/` |
| `db:migrate` | Apply the migrations to the database of `.env` |
| `db:migrate:built` | Same, from the build (`dist/db/migrate.mjs`): run before each production deployment, with the service's environment |
| `test` | Run the tests against `checkit_test` (migrations applied first) |
| `typecheck` | Check the types |

Run them from the repository root with `pnpm --filter api <script>`.

## API

Every route is prefixed with `/v1`. Responses are JSON; lists come as `{ data, pagination: { page, pageSize, total } }`, paginated with the `page` and `pageSize` query parameters.

### Authentication

Handled by Better Auth under `/v1/auth/*`, with a session in an HTTP-only cookie. Front ends send their requests with `credentials: "include"`.

| Route | Effect |
| --- | --- |
| `POST /v1/auth/email-otp/send-verification-otp` `{ email, type: "sign-in" }` | Emails a 6-digit sign-in code |
| `POST /v1/auth/sign-in/email-otp` `{ email, otp }` | Signs in with the code (creates the account if needed) |
| `POST /v1/auth/sign-in/magic-link` `{ email, callbackURL }` | Emails a sign-in link; opening it signs in and redirects to `callbackURL` (must be one of `CORS_ORIGINS`) |
| `POST /v1/auth/sign-out` | Signs out |
| `GET /v1/me` | Profile of the signed-in user (`name` is empty until they choose one) |
| `PATCH /v1/me` `{ name }` | Sets the user's name (1 to 60 characters) |

Codes and links are valid for 10 minutes. Emails are in English, French or Spanish depending on the request's `Accept-Language` (the front end sends the app's language). Password sign-in is disabled. Errors of the `/v1/auth/*` routes come from Better Auth, as `{ code, message }` with uppercase codes (e.g. `INVALID_OTP`); `@repo/resources` reads them like the API's.

### Lists

All these routes require a session. Roles on a list: `viewer` reads, `editor` also changes the items and renames the list, `owner` also deletes it and manages its sharing.

| Route | Minimum role | Effect |
| --- | --- | --- |
| `GET /v1/lists` | member | The user's lists, newest first, with their role and item counts |
| `POST /v1/lists` `{ name }` | signed in | Creates a list owned by the user |
| `GET /v1/lists/:listId` | `viewer` | One list |
| `PATCH /v1/lists/:listId` `{ name }` | `editor` | Renames the list |
| `DELETE /v1/lists/:listId` | `owner` | Deletes the list, its items and memberships |
| `GET /v1/items?status=open\|checked\|all` | signed in | The user's items across all their lists (`open` by default), each with its `list` (`id`, `name`, `role`), grouped by list in the order of `GET /v1/lists`; up to 200 per page |
| `GET /v1/lists/:listId/items` | `viewer` | Items in display order |
| `POST /v1/lists/:listId/items` `{ label }` | `editor` | Adds an item at the end (201). A checked item with the same label is unchecked and returned instead (200); one among the items to do is refused (409 `item_label_taken`) |
| `POST /v1/lists/:listId/items/batch` `{ labels }` | `editor` | Adds up to 50 items at once (voice input). Returns `{ data, restored, skipped }`: the items added, the checked ones unchecked because their label came again, and the labels left out (already to do, or repeated) |
| `PATCH /v1/lists/:listId/items` `{ done }` | `editor` | Checks or unchecks every item; returns `{ data }`, the items whose state changed |
| `PATCH /v1/lists/:listId/items/:itemId` `{ label?, done?, position? }` | `editor` | Renames, checks / unchecks or moves an item; a label another item has is refused (409 `item_label_taken`) |
| `DELETE /v1/lists/:listId/items/:itemId` | `editor` | Deletes an item |
| `GET /v1/lists/:listId/members` | `viewer` | Members with their role |
| `PATCH /v1/lists/:listId/members/:userId` `{ role }` | `owner` | Changes a member's role (`editor` or `viewer`) |
| `DELETE /v1/lists/:listId/members/:userId` | `owner` | Removes a member |
| `DELETE /v1/lists/:listId/members/me` | `viewer` | Leaves the list (not possible for the owner, who deletes it instead) |

Items are ordered by `position`, a floating-point number: to move an item, give it a position between its new neighbors'. Request and response shapes are the schemas of [`@repo/schemas`](../../packages/schemas).

### Sharing

The owner shares a list in two ways, each granting `editor` or `viewer` (never `owner`):

- **Invitation**: sent to an email address, valid for 7 days, and only accepted by a user signed in with that address, through the email's link or from the app (`/v1/me/invitations`); an invitation sent to someone else answers 404 there. Declining deletes it. Inviting the same address again replaces the pending invitation. A list has at most 50 pending invitations. The email links to the front end, `<APP_URL>/invitations/<token>`, in the inviter's language.
- **Share link**: anyone with the link can join after signing in. One active link per role at most; it lasts until revoked, and creating a new one for the same role revokes the previous one. The front end builds the URL to share from the link's `token`.

Joining never downgrades a member: an editor who opens a viewer link stays editor, a viewer who opens an editor link becomes editor.

| Route | Session | Effect |
| --- | --- | --- |
| `POST /v1/lists/:listId/invitations` `{ email, role }` | `owner` | Invites someone by email |
| `GET /v1/lists/:listId/invitations` | `owner` | Pending invitations |
| `DELETE /v1/lists/:listId/invitations/:invitationId` | `owner` | Cancels an invitation |
| `GET /v1/invitations/:token` | no | Preview: list name, role, invited email, inviter's name (null if they have none) |
| `POST /v1/invitations/:token/accept` | yes | Accepts the invitation; returns the list |
| `GET /v1/me/invitations` | yes | Pending invitations sent to the user's email, most recent first: list name, role, inviter's name |
| `POST /v1/me/invitations/:invitationId/accept` | yes | Accepts one of them from the app, without the link; returns the list |
| `DELETE /v1/me/invitations/:invitationId` | yes | Declines one of them: the invitation is deleted, its link stops working |
| `POST /v1/lists/:listId/share-links` `{ role }` | `owner` | Creates the share link for a role |
| `GET /v1/lists/:listId/share-links` | `owner` | Active share links |
| `DELETE /v1/lists/:listId/share-links/:linkId` | `owner` | Revokes a share link |
| `GET /v1/share-links/:token` | no | Preview: list name, role, owner's name (null if they have none) |
| `POST /v1/share-links/:token/join` | yes | Joins the list; returns the list |

The previews are public, so they never show the inviter's or the owner's email.

### Real time

`GET /v1/lists/:listId/events` (minimum role `viewer`) opens a [Server-Sent Events](https://developer.mozilla.org/docs/Web/API/Server-sent_events) stream of the list's changes. In the browser:

```ts
const events = new EventSource(`${API_URL}/v1/lists/${listId}/events`, { withCredentials: true });
events.addEventListener("ready", () => reloadList());
events.addEventListener("items.created", (message) => {
	const event = listEventSchema.parse(JSON.parse(message.data));
	// ...
});
```

- The stream starts with a `ready` event. Missed events aren't replayed: after a disconnection, the browser reconnects by itself, receives `ready` again, and the front end reloads the list.
- Each change is an event named after its `type`, whose data is the whole event as JSON (`listEventSchema` of `@repo/schemas`). Every event carries `listId` and `actorId`, the user who made the change, so a front end can skip its own changes.
- A comment line is sent every 25 seconds so proxies keep the connection open.

| Event | Data | Sent when |
| --- | --- | --- |
| `items.created` | `items` | Items are added, one or several at once |
| `item.updated` | `item` | An item is renamed, checked, unchecked or moved |
| `items.updated` | `items` | Every item is checked or unchecked at once; only the items whose state changed |
| `item.deleted` | `itemId` | An item is deleted |
| `list.updated` | `name`, `updatedAt` | The list is renamed |
| `list.deleted` | | The list is deleted; the server then ends every stream |
| `member.added` / `member.updated` | `member` | Someone joins (invitation, share link), or a role changes |
| `member.removed` | `userId` | A member is removed or leaves; the server ends that member's stream |

### Errors

Every error has the same shape:

```json
{ "error": { "code": "validation_error", "message": "Invalid request", "details": [{ "field": "name", "message": "list_name_required" }] } }
```

| Status | `code` | When |
| --- | --- | --- |
| 401 | `unauthorized` | No valid session |
| 403 | `forbidden` | The user's role on the list is too low, or a cross-site form was rejected (CSRF) |
| 403 | `invitation_email_mismatch` | The invitation was sent to another email than the signed-in user's |
| 404 | `not_found`, `list_not_found`, `item_not_found`, `member_not_found`, `invitation_not_found`, `share_link_not_found` | Unknown route or resource; a list the user isn't a member of is reported as not found |
| 409 | `item_label_taken` | Adding or renaming an item with the label of another item to do of the list (case and extra spaces aside, `normalizeItemLabel()` of `@repo/schemas`) |
| 409 | `already_member` | Inviting someone who is already a member |
| 409 | `owner_role_locked`, `owner_cannot_leave` | Changing or removing the owner's membership, or the owner leaving |
| 410 | `invitation_expired`, `share_link_revoked` | The invitation expired or was already used; the share link was revoked |
| 413 | `payload_too_large` | Body over 1 MB |
| 422 | `validation_error` | Invalid input; `details` lists each field with an error code from `@repo/schemas` |
| 429 | `too_many_invitations` | The list already has 50 pending invitations |
| 500 | `internal_error` | Unexpected error, logged on the server, never detailed in the response |
| 503 | `email_unavailable` | Resend refused the email or didn't answer in 10 seconds (the reason is logged on the server) |

## Email sending

Sign-in links and codes and invitations are sent with Resend's REST API (`src/lib/mailer.ts`, no SDK), as plain text, in the recipient's language.

1. In Resend, add the sender's domain in the **EU region** (Ireland), then add the DNS records Resend gives (SPF, DKIM). Use a subdomain (e.g. `mail.example.com`) to keep the main domain's reputation separate.
2. Create an API key with "Sending access", restricted to that domain.
3. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env` (or the host's secrets in production).

Before the domain is verified, `EMAIL_FROM=onboarding@resend.dev` works for trying it out, but only towards the email address of the Resend account. To print the emails again in development, remove both variables.

## Tests

```sh
pnpm --filter api test
```

The tests call the app in memory through `app.request()` and use the `checkit_test` database, emptied before each test. Helpers in `test/helpers/` sign a user in (`signIn()`), capture the emails sent (`captureEmails()`), call the API (`api()`), create a list and add a member (`createList()`, `joinList()`), and read a list's event stream (`openEventStream()`).

## Production notes

- Deployed on Railway: see [docs/deployment.md](../../docs/deployment.md).

- Emails are sent with Resend, required in production: the API refuses to start without `RESEND_API_KEY` and `EMAIL_FROM`, rather than print sign-in links and codes to the logs. See "Email sending".
- Better Auth's rate limiting is active in production only, kept in memory: enough for a single instance.
- Hosting options: [docs/hosting.md](../../docs/hosting.md). Real time needs a long-running process holding the SSE connections, not serverless functions.
- Real-time events only reach the connections of the instance that published them: with several API instances, replace the in-memory bus (`src/realtime/list-events.ts`) with PostgreSQL `LISTEN/NOTIFY`.
