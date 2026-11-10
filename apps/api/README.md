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

All these routes require a session. Roles on a list: `viewer` reads, `editor` also changes the items and renames the list, `owner` also deletes it.

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

Items are ordered by `position`, a floating-point number: to move an item, give it a position between its new neighbors'. Request and response shapes are the schemas of [`@repo/schemas`](../../packages/schemas).

### Errors

Every error has the same shape:

```json
{ "error": { "code": "validation_error", "message": "Invalid request", "details": [{ "field": "name", "message": "list_name_required" }] } }
```

| Status | `code` | When |
| --- | --- | --- |
| 401 | `unauthorized` | No valid session |
| 403 | `forbidden` | The user's role on the list is too low, or a cross-site form was rejected (CSRF) |
| 404 | `not_found`, `list_not_found`, `item_not_found` | Unknown route or resource; a list the user isn't a member of is reported as not found |
| 413 | `payload_too_large` | Body over 1 MB |
| 422 | `validation_error` | Invalid input; `details` lists each field with an error code from `@repo/schemas` |
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
