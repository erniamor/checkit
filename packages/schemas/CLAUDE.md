# CLAUDE.md : packages/schemas

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to the package of Zod schemas shared by the API and the front ends.

## Role

The contract between `apps/api` and the front ends: the Zod schemas of the API's inputs (forms, request bodies) and outputs (resources, response envelopes), with their derived types. The API validates its inputs with them; the front ends (through `packages/resources` and their forms) validate the same inputs and type the responses with them.

What stays out of this package: the Drizzle schema (internal to the API), schemas used by a single app (URL parameters, pagination query, environment variables).

## Package-specific stack

- TypeScript in `strict` mode, configuration extended from `@repo/config-ts/base.json` (no DOM, no Node)
- Zod (from the `catalog:`), its only dependency
- Tests: Vitest

## Commands

- Tests: `pnpm --filter @repo/schemas test`
- Typecheck: `pnpm --filter @repo/schemas typecheck`

## Structure

- `src/common.ts`: shared building blocks (dates, pagination envelope)
- `src/<domain>.schema.ts`: one file per domain (`lists`, `items`, `members`...), with its constants (maximum lengths...)
- `src/<domain>.schema.test.ts`: its tests
- `src/index.ts`: the package's public API (what is exported here is the contract)

Inside the package, files import each other through relative paths (`./common`): there is no `@/` alias in packages.

## Conventions

- Naming: schema in `camelCase` suffixed `Schema` (`createListSchema`), derived type in `PascalCase` with no suffix (`CreateList`). Always export the type with the schema: `export type CreateList = z.infer<typeof createListSchema>`.
- Distinguish the shapes (create, update, response) and derive them from a common base rather than redefining them.
- Strict inputs: `z.strictObject`. No `z.any()`; prefer `z.unknown()` and then narrowing.
- Precise constraints (lengths, formats, enumerations, bounds), exported as constants when the front ends need them (`LIST_NAME_MAX_LENGTH`).
- Error messages are codes (`list_name_required`), not sentences: the front ends translate them in every locale, and the API returns them in the `details` of its 422 errors.
- Response schemas describe the JSON: dates are ISO 8601 strings (`dateTimeSchema`), not `Date` objects.
- Avoid transformations; `trim()` on text inputs is accepted, with a comment. Comment any other.
- No dependency on the browser, Node or React: the schemas run identically on the client and on the server.

## Compatibility

- Every schema is a contract between the API and the front ends: changing a field, a constraint or an error code affects both sides.
- Before modifying a schema, search for its usages in `apps/` and `packages/`, and update the API, `resources` and the apps in the same change.
- Prefer adding an optional field over modifying an existing one; flag any breaking change in the commit message.

## Never do

- Depend on an app or on another internal package.
- Put the Drizzle schema, or schemas used by a single app, here.
- Write sentences as error messages, or a single-language message.
