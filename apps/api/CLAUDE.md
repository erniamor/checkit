# CLAUDE.md : apps/api

> Complements the root `CLAUDE.md`, which also applies here, except for what is specific to TanStack Start, React and shadcn components: this app is a Hono web server, with no UI. Contains only the rules specific to this API.

## Role

The product's backend. Exposes a JSON REST API consumed by `apps/www` through `@repo/resources`. Manages accounts and sign-in, to-do lists, their items and members, sharing (email invitations and share links), and pushes list changes to members in real time. Calls an email provider (sign-in links and codes, invitations) and, later, a speech-to-text service.

## App-specific stack

- Hono 4.x on Node 24, served by `@hono/node-server`
- Database: PostgreSQL 17, accessed through Drizzle ORM with the `postgres` (postgres.js) driver; snake_case column names (`casing: "snake_case"`); versioned SQL migrations with `drizzle-kit`
- Validation: Zod, through Hono's validator middleware (`@hono/zod-validator`)
- Authentication: Better Auth, sessions in an HTTP-only cookie; passwordless email (magic link, one-time code) and Google (see "Authentication")
- Real time: WebSockets (to be set up), one channel per list
- Dev: `tsx watch`; build: tsdown bundle to `dist/index.mjs`, which also compiles the internal `@repo/*` packages consumed as TypeScript source
- TypeScript: extends `@repo/config-ts/node.json` (Node code without DOM)
- Tests: Vitest, with Hono's `app.request()` for routes, against the Docker test database

## Local database

`docker-compose.yml` starts PostgreSQL on host port **5433** (5432 is often taken by other projects), with two databases: `checkit` (development) and `checkit_test` (tests, created by `docker/postgres/init.sql` when the volume is first created). Docker must be running for the dev server and the tests.

## Commands

- Start / stop the local database: `pnpm --filter api db:up`, `pnpm --filter api db:down`
- Dev: `pnpm --filter api dev` (reads `.env`; copy `.env.example` first)
- Build: `pnpm --filter api build`
- Production start: `pnpm --filter api start`
- Generate a migration: `pnpm --filter api db:generate`
- Apply migrations: `pnpm --filter api db:migrate`
- Tests: `pnpm --filter api test` (applies the migrations to `checkit_test` first)
- Typecheck: `pnpm --filter api typecheck`

## Structure

- `src/index.ts`: entry point; starts the Node server with the app built in `app.ts`
- `src/app.ts`: builds the Hono app (global middlewares, mounting of route modules, error handler), with no side effect, so tests can import it
- `src/env.ts`: environment variables validated with Zod at startup; the only place that reads `process.env`
- `src/routes/<domain>/`: one folder per domain (`health`, `me`, `lists`, `items`, `members`)
  - `<domain>.routes.ts`: the domain's Hono sub-app (routes, validators, call to the service)
  - `<domain>.service.ts`: business logic, independent of Hono
  - `<domain>.schemas.ts`: Zod schemas used only by this API (shared ones are in `@repo/schemas`)
  - `<domain>.test.ts`: tests
- `src/middlewares/`: cross-cutting middlewares (`require-auth.ts`, `require-list-role.ts`)
- `src/db/`: Drizzle client (`client.ts`), schema (`schema/<table>.ts`, re-exported by `schema/index.ts`) and migration script (`migrate.ts`)
- `src/lib/`: utilities specific to the app (`auth.ts`: Better Auth instance; `errors.ts`: `AppError` and the error body; `error-handler.ts`: global error and not-found handlers; `mailer.ts`: email sending; `locale.ts`: locale resolution from `Accept-Language`; `validator.ts`: `validate()`, the `zValidator` answering 422 in the API's error format; `pagination.ts`: pagination query schema)
- `src/emails/`: email contents, in every supported locale
- `test/`: Vitest global setup (checks the test database and applies the migrations), database reset before each test, and helpers (`helpers/auth.ts`: `signIn()`, `captureEmails()`; `helpers/api.ts`: `api()`, `json()`, `createList()`, `joinList()`), imported through the `@test/` alias
- `drizzle/`: generated SQL migrations, committed, never edited after they have been applied
- `docker-compose.yml`, `docker/`: local PostgreSQL

## Authentication

- Better Auth is mounted on `/v1/auth/*` and configured in `src/lib/auth.ts`. Password sign-in stays disabled; Google is enabled only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- Its tables (`users`, `sessions`, `accounts`, `verifications`) are written by hand in `src/db/schema/` (plural names, `usePlural: true`, uuid ids). `auth.schema.test.ts` checks them against what Better Auth expects: after a Better Auth upgrade or a new plugin, run the tests and add the missing fields with a migration.
- Protect a route with the `requireAuth` middleware, then read `c.get("user")`; never trust a user identifier sent by the client.
- Keep `advanced.disableOriginCheck: false`: Better Auth otherwise skips its callback URL and origin checks when `NODE_ENV` is `test`.
- Emails go through `mailer`: printed to the console in development and tests, unavailable in production until an email provider is chosen. Their locale comes from the request's `Accept-Language` header.

## Lists and access

- Access to a list depends on the user's role in `list_members`: `viewer` reads, `editor` also changes the items and renames the list, `owner` also deletes the list (and, later, manages its members). The owner is the member with the `owner` role; `lists` has no owner column.
- Every route under `/lists/:listId` goes through `requireListRole(minimum)`, which sets `c.get("listId")` and `c.get("role")`. A user who isn't a member gets a 404 (`list_not_found`), never a 403, so the list's existence isn't revealed.
- Items are ordered by `position`, a floating-point number: new items go after the last one, and moving an item means giving it a position between its new neighbors.

## Routes and handlers

- Each domain is a Hono sub-app mounted in `app.ts` with `app.route("/<domain>", ...)`. Prefix the API with a version (`/v1`).
- Handlers stay thin: read the validated input, call a service, return the response. Business logic lives in services, which know nothing about Hono (no `Context` passed to services).
- Validate every input (`param`, `query`, `json`, `form`, `header`) with `validate()` (from `src/lib/validator.ts`, a `zValidator` that answers 422 in the API's error format) and a Zod schema before use; read it with `c.req.valid(...)`, never with `c.req.json()` directly.
- Follow REST conventions: plural resource names, appropriate HTTP methods and status codes (`201` on creation, `204` with no content, `404`, `409`, `422`).
- Consistent response shapes: a resource or a `{ data, pagination }` list; errors in a single format `{ error: { code, message, details? } }`, produced by the global error handler (`app.onError`) from `HTTPException` or typed errors.
- Paginate every list, with a maximum page size enforced by the server.
- Never return sensitive fields (password hashes, tokens, private data): responses are built explicitly, not by returning the database row.

## Data and migrations

- The Drizzle schema in `src/db/schema/` is the source of truth for the database structure; types are derived from it (`InferSelectModel`, `InferInsertModel`), never written by hand.
- Every structural change goes through a migration generated by `drizzle-kit generate`, reviewed and committed. Never `drizzle-kit push` outside a local database.
- Data access only goes through Drizzle and the services; raw SQL (`sql`) only where clearly necessary and commented, always with parameters, never string concatenation.
- Use transactions for operations that write to several tables.
- Never delete, empty or reset a database, nor run a migration or a data import on production unless I explicitly ask for it.
- Required base data (roles, reference data) is created by an idempotent seed script, not by hand in an environment.

## Contract with the front ends

- The API's routes and responses form a contract with the apps that consume them through `@repo/resources`: renaming, removing or making a field required can break the front ends.
- Before modifying an existing route or response, search for its usages in `apps/` and `packages/` and update `resources` and the consuming apps in the same change.
- Prefer adding an optional field or a new route over modifying an existing one; a breaking change goes through a new API version.
- Schemas shared with the front ends (form inputs, responses) come from `@repo/schemas` and are never redefined here; responses are built to match their response schema. This app imports nothing from `packages/resources`: it is the API's client, not the other way around.

## Security

- Secrets (database URL, signing keys, third-party API keys) only in environment variables, validated in `src/env.ts`, never in the repository. Provide a `.env.example` without real values.
- Authentication and authorization are checked here, on every protected route, through middlewares; never assume the front end has checked them.
- Configure CORS (`hono/cors`) with the list of allowed origins, never `*` in production; add the security headers (`hono/secure-headers`).
- Cookies: `HttpOnly`, `Secure`, `SameSite`; protect cookie-authenticated mutations against CSRF (`hono/csrf`).
- Limit the request body size and rate-limit sensitive routes (authentication, forms).
- Never log a password, token or personal data; error responses never expose a stack trace or SQL error in production.

## Tests

- Test services and pure logic first.
- Test routes through `app.request()` on the app built in `app.ts`, without starting a server: status codes, response shapes, validation errors.
- Database tests run on a dedicated test database (or a disposable container), reset between tests, never against a development or production database.
- Explicitly test permission cases: an unauthenticated or unauthorized user must not be able to access the route.

## Never do

- Read `process.env` outside `src/env.ts`, or commit an `.env`, a key or a database dump.
- Put business logic in a handler, or pass Hono's `Context` to a service.
- Use an unvalidated input, or return a database row as-is.
- Edit a migration that has already been applied, or use `drizzle-kit push` on a shared database.
- Open CORS to `*` in production, or disable authentication on a route without an explicit request.
- Import code from another app, or use React, TanStack Start or shadcn in this app.
- Modify a route's contract without checking and updating its consumers.
