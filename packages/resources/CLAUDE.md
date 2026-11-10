# CLAUDE.md : packages/resources

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to the package that exposes the backend's API to the front ends and that, for now, carries the shared Zod schemas. The backend is the Hono API (`apps/api`).

## Role

Single data access point for the front-end applications: each business resource (`lists`, `items`, `invitations`...) matches a domain of `apps/api` and exposes its typed operations (list, detail, create, update, delete) on top of its REST API. The package also contains the front ends' shared Zod schemas (forms, parameters, response envelopes, validation of critical data). Consumed by `apps/www`.

The schemas are here on a provisional basis: as long as only `resources` and the front ends use them, a separate `schemas` package would be premature. See "Extracting `schemas`" below.

## Package-specific stack

- TypeScript in `strict` mode, with no dependency on React or a front-end framework: the core is usable anywhere.
- Zod to validate inputs and some responses
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
- `src/schemas/`: shared Zod schemas, one file per domain
  - `common.ts`: reusable building blocks (identifiers, dates, response and pagination envelopes, errors)
  - `<domain>.schema.ts` and `<domain>.schema.test.ts`
- `src/<resource>/`: one folder per business resource
  - `<resource>.resource.ts`: the resource's operations
  - `<resource>.resource.test.ts`: their tests
- `src/errors.ts`: typed error classes (network, validation, authentication, authorization, not found, server)
- `src/index.ts`: the package's public API (what is exported here is the contract)

<Adapt to the real resources and domains.>

## Package rules

- The package depends on no app and no other internal package.
- No UI logic: no components, no React hooks, no global state. If TanStack Query `queryOptions` are provided, they remain simple factories with no dependency on React.
- No backend business logic: this package describes how to call the backend, not what the backend does.
- Every network call from the front ends goes through a resource here. If an app needs a new call, add the operation to the matching resource, not a `fetch` in the app.
- The backend's details (envelopes, filter syntax) stay confined to `src/<backend>/` and the resources: the apps receive clean, typed data with no envelope.
- Only what is exported by `src/index.ts` is usable by the apps; they never import internal paths.
- Consumed as TypeScript source (`exports` pointing to `.ts`), with no build step of its own.
- The API's URL and the configuration (token, headers) are injected when the client is created, never read directly from the environment nor hard-coded.
- The backend (`apps/api`) imports nothing from this package: it is the backend's client, not the other way around.

## Resource conventions

- A resource is an object that groups the operations of a backend resource: `articles.list()`, `articles.get(id)`, `articles.create(input)`, `articles.update(id, input)`, `articles.remove(id)`. Keep this vocabulary consistent across resources.
- Inputs and outputs have explicit types, derived from a Zod schema or from the backend's types: never a type copied by hand as a duplicate.
- Validate inputs before sending with their Zod schema.
- Lists return the items with the pagination information. Respect the pagination limits configured in the backend.
- Errors are typed errors from `src/errors.ts` built from the backend's error envelope (400, 401, 403, 404, 422, 5xx, network), never strings or generic `Error`s.
- Operations return typed data, not the raw `Response`.
- Cancellation: accept an optional `AbortSignal` in read operations.
- Never log a token or personal data.

- Request and response bodies are the API's resources as-is, with no extra envelope; lists are read from `{ data, pagination }`.
- Response types are derived from the Zod schemas shared with `apps/api` (in `packages/schemas` once extracted), never from the Drizzle schema, which stays internal to the API.
- Errors are built from the `{ error: { code, message, details? } }` envelope; a 422 carries the validation details to display in the form.

## Zod schemas

Zod schemas are used for:

- **Inputs**: forms (contact, order...), search and route parameters, inputs sent to the backend.
- **Common envelopes**: response and pagination, errors.
- **Environment variables** of the front ends, validated at startup.
- **Response validation for critical data**: it catches a response that doesn't match what the front end expects. A response schema matches a specific operation.

The API validates its inputs with Zod: the schemas of inputs sent by the front ends (forms) and of the responses they read are the same on both sides. As soon as `apps/api` needs one, extract them into `packages/schemas` (see "Extracting `schemas`"); never redefine them in `apps/api` and here.

### Conventions

- Naming: schema in `camelCase` suffixed `Schema` (`contactFormSchema`), derived type in `PascalCase` with no suffix (`ContactForm`). Always export the type with the schema: `export type ContactForm = z.infer<typeof contactFormSchema>`.
- Distinguish the shapes (entity, create, update, response) and derive them from a common base (`pick`, `omit`, `extend`, `partial`) rather than redefining them.
- Compose schemas rather than duplicating them; put shared building blocks in `common.ts`.
- Strict by default: `z.strictObject` or `.strict()` for inputs; justify any `.passthrough()`. No `z.any()`; prefer `z.unknown()` and then narrowing.
- Precise constraints (lengths, formats `z.email()` / `z.uuid()`, enumerations, bounds) and readable error messages for direct display in a form, in <French | English>.
- Avoid transformations (`transform`, `coerce`) that hide surprising behavior; if needed, comment them.
- Prefer `safeParse` when the error must be handled; `parse` only when failure should interrupt the flow.
- No dependency on the browser, Node or React: the schemas run identically on the client and on the server.

## Extracting `schemas`

Extract `src/schemas/` into a `packages/schemas` package as soon as a second consumer needs it: the routes of `apps/api` or another package. With `apps/api`, this happens as soon as the first shared form or response is written. Until then, don't create this package.

At extraction time: move the folder, make `resources` depend on the new package, and update the apps' imports and the relevant `CLAUDE.md` files, all in the same change.

## Authentication

- The client receives a configuration or a function to provide the token; the package never stores credentials.
- A 401 or 403 response produces a typed error; the redirect or session refresh is decided by the app, not by this package.

- Follow the authentication mode chosen in `apps/api`: with a session cookie, requests are sent with `credentials: "include"` and the package handles no token; a server-to-server key never reaches the browser.

## Compatibility

- Resources and schemas are the contract between the front ends and the backend: renaming an operation, or changing a signature, a return type or a constraint affects all apps, and modifying a backend route in `apps/api` affects the resources.
- Before modifying an existing operation or schema, search for its usages in `apps/` and update all consumers in the same change.
- A contract change follows this consistent order: the backend (`apps/api` route), `resources` (operations and schemas), then the consuming apps, all in a single change.
- Prefer adding an operation, a field or an optional parameter over modifying existing behavior; flag any breaking change in the commit message and in the work summary.

## Tests

- Test each resource with a mocked network (for example a mocked `fetch` or a test server), never against a real backend instance.
- Cover success cases, invalid input validation, out-of-contract responses and each type of error (401, 403, 404, 422, 500, network, cancellation).
- Verify that the requests sent (method, URL, query parameters, body, headers) match what is expected.
- Test each schema with valid, invalid and edge cases (empty values, bounds, formats) and check the error messages used in forms.

## Never do

- Import from `apps/` or reference it, including types (no Hono `AppType`).
- Hand-write a type that duplicates a schema or a backend type.
- Let the backend's envelope (`data`, `meta`, `pagination`) or query syntax leak into the apps.
- Ignore pagination.
- Add UI logic, global state or dependencies on React.
- Read `process.env` or hard-code a URL, token or key.
- Expose a backend secret (server-to-server key) to the browser.
- Return unvalidated responses for critical data, or ignore a request's errors.
- Modify a resource's or schema's contract without updating all its consumers.
