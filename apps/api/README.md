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
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no | Enable Google sign-in; both or none. Redirect URI: `<API_URL>/v1/auth/callback/google` |

## Scripts

| Script | Effect |
| --- | --- |
| `dev` | Development server with reload (`tsx watch`) |
| `build` / `start` | Bundle to `dist/index.mjs` with tsdown / run it |
| `db:up` / `db:down` | Start / stop the local PostgreSQL |
| `db:generate` | Generate a SQL migration from the Drizzle schema (`src/db/schema/`) into `drizzle/` |
| `db:migrate` | Apply the migrations to the database of `.env` |
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
| `GET /v1/me` | Profile of the signed-in user |

Codes and links are valid for 10 minutes. Emails are in English, French or Spanish depending on the browser's `Accept-Language`. Password sign-in is disabled.

### Lists

All these routes require a session. Roles on a list: `viewer` reads, `editor` also changes the items and renames the list, `owner` also deletes it and manages its sharing.

| Route | Minimum role | Effect |
| --- | --- | --- |
| `GET /v1/lists` | member | The user's lists, newest first, with their role and item counts |
| `POST /v1/lists` `{ name }` | signed in | Creates a list owned by the user |
| `GET /v1/lists/:listId` | `viewer` | One list |
| `PATCH /v1/lists/:listId` `{ name }` | `editor` | Renames the list |
| `DELETE /v1/lists/:listId` | `owner` | Deletes the list, its items and memberships |
| `GET /v1/lists/:listId/items` | `viewer` | Items in display order |
| `POST /v1/lists/:listId/items` `{ label }` | `editor` | Adds an item at the end |
| `POST /v1/lists/:listId/items/batch` `{ labels }` | `editor` | Adds up to 50 items at once (voice input) |
| `PATCH /v1/lists/:listId/items/:itemId` `{ label?, done?, position? }` | `editor` | Renames, checks / unchecks or moves an item |
| `DELETE /v1/lists/:listId/items/:itemId` | `editor` | Deletes an item |
| `GET /v1/lists/:listId/members` | `viewer` | Members with their role |
| `PATCH /v1/lists/:listId/members/:userId` `{ role }` | `owner` | Changes a member's role (`editor` or `viewer`) |
| `DELETE /v1/lists/:listId/members/:userId` | `owner` | Removes a member |
| `DELETE /v1/lists/:listId/members/me` | `viewer` | Leaves the list (not possible for the owner, who deletes it instead) |

Items are ordered by `position`, a floating-point number: to move an item, give it a position between its new neighbors'. Request and response shapes are the schemas of [`@repo/schemas`](../../packages/schemas).

### Sharing

The owner shares a list in two ways, each granting `editor` or `viewer` (never `owner`):

- **Invitation**: sent to an email address, valid for 7 days, and only accepted by a user signed in with that address. Inviting the same address again replaces the pending invitation. A list has at most 50 pending invitations. The email links to the front end, `<APP_URL>/invitations/<token>`, in the inviter's language.
- **Share link**: anyone with the link can join after signing in. One active link per role at most; it lasts until revoked, and creating a new one for the same role revokes the previous one. The front end builds the URL to share from the link's `token`.

Joining never downgrades a member: an editor who opens a viewer link stays editor, a viewer who opens an editor link becomes editor.

| Route | Session | Effect |
| --- | --- | --- |
| `POST /v1/lists/:listId/invitations` `{ email, role }` | `owner` | Invites someone by email |
| `GET /v1/lists/:listId/invitations` | `owner` | Pending invitations |
| `DELETE /v1/lists/:listId/invitations/:invitationId` | `owner` | Cancels an invitation |
| `GET /v1/invitations/:token` | no | Preview: list name, role, invited email, who invited |
| `POST /v1/invitations/:token/accept` | yes | Accepts the invitation; returns the list |
| `POST /v1/lists/:listId/share-links` `{ role }` | `owner` | Creates the share link for a role |
| `GET /v1/lists/:listId/share-links` | `owner` | Active share links |
| `DELETE /v1/lists/:listId/share-links/:linkId` | `owner` | Revokes a share link |
| `GET /v1/share-links/:token` | no | Preview: list name, role, owner |
| `POST /v1/share-links/:token/join` | yes | Joins the list; returns the list |

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
| 409 | `already_member` | Inviting someone who is already a member |
| 409 | `owner_role_locked`, `owner_cannot_leave` | Changing or removing the owner's membership, or the owner leaving |
| 410 | `invitation_expired`, `share_link_revoked` | The invitation expired or was already used; the share link was revoked |
| 413 | `payload_too_large` | Body over 1 MB |
| 422 | `validation_error` | Invalid input; `details` lists each field with an error code from `@repo/schemas` |
| 429 | `too_many_invitations` | The list already has 50 pending invitations |
| 500 | `internal_error` | Unexpected error, logged on the server, never detailed in the response |
| 503 | `email_unavailable` | Production without an email provider (none chosen yet) |

## Tests

```sh
pnpm --filter api test
```

The tests call the app in memory through `app.request()` and use the `checkit_test` database, emptied before each test. Helpers in `test/helpers/` sign a user in (`signIn()`), capture the emails sent (`captureEmails()`), call the API (`api()`), create a list and add a member (`createList()`, `joinList()`).

## Production notes

- Sign-in by email is unavailable until an email provider is chosen: in production, the API refuses to print links and codes to the logs.
- Better Auth's rate limiting is active in production only, kept in memory: enough for a single instance.
- Hosting options: [docs/hosting.md](../../docs/hosting.md). Real time will need a long-running process (WebSockets), not serverless functions.
