# CLAUDE.md : packages/resources

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to the package that exposes the backend's API to the front ends. The backend is the Hono API (`apps/api`).

## Role

Single data access point for the front-end applications: each business resource (`lists`, `items`, `invitations`...) matches a domain of `apps/api` and exposes its typed operations (list, detail, create, update, delete) on top of its REST API. Consumed by `apps/www`.

The Zod schemas of the API's inputs and responses live in `packages/schemas`, shared with `apps/api`: this package uses them, it doesn't define them.

## Package-specific stack

- TypeScript in `strict` mode, with no dependency on React or a front-end framework: the core is usable anywhere.
- Zod schemas from `@repo/schemas` to validate inputs and some responses
- Native `fetch` as transport
- Tests: Vitest, with a mocked network
- <Add: TanStack Query, if `queryOptions` are provided by this package>
- The `apps/api` REST API, versioned (`/v1`), with its `{ data, pagination }` responses and `{ error: { code, message, details? } }` errors
- No Hono RPC client (`hc`): it would require importing the `AppType` type from `apps/api`, and a package never depends on an app

## Commands

- Tests: `pnpm --filter resources test`
- Typecheck: `pnpm --filter resources typecheck`

## Structure

- `src/http/`: base HTTP client (API URL, headers, authentication, timeouts)
- `src/api/`: everything specific to the backend's API
  - building query parameters (filters, sort, pagination...)
  - reading the response envelope and the error envelope
- `src/<resource>/`: one folder per business resource
  - `<resource>.resource.ts`: the resource's operations
  - `<resource>.resource.test.ts`: their tests
- `src/errors.ts`: typed error classes (network, validation, authentication, authorization, not found, server)
- `src/index.ts`: the package's public API (what is exported here is the contract)

## Package rules

- The package depends on no app; its only internal dependency is `@repo/schemas`.
- No UI logic: no components, no React hooks, no global state. If TanStack Query `queryOptions` are provided, they remain simple factories with no dependency on React.
- No backend business logic: this package describes how to call the backend, not what the backend does.
- Every network call from the front ends goes through a resource here. If an app needs a new call, add the operation to the matching resource, not a `fetch` in the app.
- The backend's details (envelopes, query syntax) stay confined to `src/api/` and the resources: the apps receive clean, typed data with no envelope.
- Only what is exported by `src/index.ts` is usable by the apps; they never import internal paths.
- Consumed as TypeScript source (`exports` pointing to `.ts`), with no build step of its own.
- The API's URL and the configuration (token, headers) are injected when the client is created, never read directly from the environment nor hard-coded.
- The backend (`apps/api`) imports nothing from this package: it is the backend's client, not the other way around.

## Resource conventions

- A resource is an object that groups the operations of a backend resource: `lists.list()`, `lists.get(id)`, `lists.create(input)`, `lists.update(id, input)`, `lists.remove(id)`. Keep this vocabulary consistent across resources.
- Inputs and outputs are typed with the types of `@repo/schemas`: never a type copied by hand as a duplicate, never a type derived from the Drizzle schema, which stays internal to the API.
- Validate inputs before sending with their schema from `@repo/schemas`; validate the responses of critical data with their response schema.
- Lists return the items with the pagination information, read from `{ data, pagination }`. Respect the pagination limits configured in the backend.
- Errors are typed errors from `src/errors.ts` built from the `{ error: { code, message, details? } }` envelope (400, 401, 403, 404, 422, 5xx, network), never strings or generic `Error`s. A 422 carries the validation details (`field`, `message` error code) to display in the form.
- Operations return typed data, not the raw `Response`.
- Cancellation: accept an optional `AbortSignal` in read operations.
- Never log a token or personal data.

## Authentication

- The API uses a session cookie: requests are sent with `credentials: "include"` and the package handles no token. A server-to-server key never reaches the browser.
- A 401 or 403 response produces a typed error; the redirect or session refresh is decided by the app, not by this package.

## Compatibility

- Resources are the contract between the front ends and the backend: renaming an operation, or changing a signature or a return type affects all apps, and modifying a route in `apps/api` affects the resources.
- Before modifying an existing operation, search for its usages in `apps/` and update all consumers in the same change.
- A contract change follows this consistent order: the backend (`apps/api` route), `schemas`, `resources`, then the consuming apps, all in a single change.
- Prefer adding an operation, a field or an optional parameter over modifying existing behavior; flag any breaking change in the commit message and in the work summary.

## Tests

- Test each resource with a mocked network (for example a mocked `fetch` or a test server), never against a real backend instance.
- Cover success cases, invalid input validation, out-of-contract responses and each type of error (401, 403, 404, 422, 500, network, cancellation).
- Verify that the requests sent (method, URL, query parameters, body, headers) match what is expected.

## Never do

- Import from `apps/` or reference it, including types (no Hono `AppType`).
- Define a schema here, or hand-write a type that duplicates a schema of `@repo/schemas`.
- Let the backend's envelope (`data`, `pagination`, `error`) or query syntax leak into the apps.
- Ignore pagination.
- Add UI logic, global state or dependencies on React.
- Read `process.env` or hard-code a URL, token or key.
- Return unvalidated responses for critical data, or ignore a request's errors.
- Modify a resource's contract without updating all its consumers.
