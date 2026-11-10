# CLAUDE.md : packages/utils

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to the shared utilities package.

## Role

Small pure functions, with no framework dependency, reusable by several apps and packages: formatting (dates, amounts, numbers), string and array manipulation, typing helpers, etc.

Beware of the main risk of this kind of package: becoming a catch-all. Guiding rule: a function only enters here if it is truly generic and used by at least two projects in the monorepo. Before that, it stays in the app that uses it (`src/lib/`).

## Package-specific stack

- TypeScript in `strict` mode, configuration extended from `@repo/config-ts/base.json` (no DOM, no file emission)
- No runtime dependency by default. Any dependency (even a small one) must be discussed before being added.
- Tests: Vitest

## Commands

- Tests: `pnpm --filter utils test`
- Typecheck: `pnpm --filter utils typecheck`

## Structure

- `src/<domain>/`: one folder per domain (`format/`, `string/`, `array/`, `date/`, `types/`...)
  - `<name>.ts`: one function per file (or a few very closely related functions)
  - `<name>.test.ts`: its tests
- `src/index.ts`: the package's public API (what is exported here is the contract)

<Adapt to the real domains.>

## Package rules

- Pure functions: same input, same output, no side effects, no reading of global state or the environment.
- No dependency on React, the DOM, Node or a framework: the code runs identically in the browser and on the server. If a function needs the DOM or Node, it doesn't belong here.
- The package depends on no app and no other internal package. Other packages may depend on it; `utils` depends on nothing.
- No business logic: no product-specific rule (e.g. computing a price, a discount rule). It lives in the app or in `packages/resources`.
- No UI logic or data access: no network call, no `fetch`.
- Named exports only, no default exports, to make unused code easier to prune (tree-shaking).
- Only what is exported by `src/index.ts` is usable by the apps; they never import internal paths.
- Consumed as TypeScript source (`exports` pointing to `.ts`), with no build step of its own.

## Code conventions

- Each function has an explicitly typed signature (parameters and return), no `any`.
- Small functions with a single role, and a name that describes the action (`formatPrice`, `slugify`, `groupBy`).
- Handle edge cases explicitly (empty values, `null`, `undefined`, empty arrays) and document the behavior with a short JSDoc comment when it isn't obvious.
- Formatting of dates, numbers and currencies: pass the locale and currency as parameters, with a documented default (`<default locale>`, `<default currency>`); never hard-code a locale in the function body.
- Never mutate arguments: return a new value.
- Prefer standard APIs (`Intl`, `Array`, `URL`) over an external dependency.
- Typing functions (type guards, type utilities) live in `src/types/` and don't generate unnecessary code at runtime.

## Compatibility

- Exported functions form a contract for all apps and packages: renaming, removing or changing the behavior of a function is a breaking change.
- Before modifying an existing function, search for its usages in `apps/` and `packages/` and update all consumers in the same change.
- Prefer adding a new function or an optional parameter over modifying existing behavior.
- A function that ends up used by a single project can be moved back down into that project to keep the package small.

## Tests

- Each function has a test, including edge cases (empty, `null`, extreme values, different locales for formatting).
- Tests are fast, deterministic and independent of the system's date, time zone and locale: set these values explicitly in the tests.
- Never delete or disable a test to make CI pass.

## Never do

- Add a function "just in case" or one used by a single project.
- Add product business logic, a network call or a dependency on React, the DOM or Node.
- Add an external dependency without prior agreement.
- Import from `apps/` or from another internal package.
- Use default exports or intermediate `index` files that re-export everything without control.
- Change an existing function's behavior without checking all its consumers.
