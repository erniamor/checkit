# CLAUDE.md

> Root file of the pnpm monorepo. Keep this file short: rules specific to an app or a package go in a `CLAUDE.md` placed in its own folder (e.g. `apps/api/CLAUDE.md`), or in an imported file (`@docs/xxx.md`).

## Project

Checkit: a small web app to manage short to-do lists shared between several users. Main features: lists synced in real time between their members, sharing by email invitation or by share link, and voice input to add items. Made of a public front end (`apps/www`) and an API (`apps/api`).

Product decisions:

- Real time is required: changes made by a member appear for the others without reloading. Delivered with Server-Sent Events (one stream per open list); changes themselves go through the REST API.
- Sharing: by email invitation and by a revocable share link, each granting a role on the list.
- Sign-in: passwordless email (magic link, with a one-time code as fallback) and Google; no passwords. Apple and passkeys may come later.
- Voice input: the browser's Web Speech API first, with server-side transcription as a fallback behind a common interface.

The site is multilingual by default: English (default locale), French and Spanish from the start. Every user-facing text, route and piece of content exists in every locale; never hard-code a single-language string in the UI.

## Stack

- Monorepo: pnpm workspaces
- Front-end app (`www`): React + TanStack Start (TanStack Router routing, server functions), TanStack Query for server state
- i18n: Paraglide JS (`apps/www`); the API translates its emails itself
- Backend (`apps/api`): Hono on Node with Drizzle and PostgreSQL, consumed by the front end through `packages/resources`
- TypeScript in `strict` mode
- Data validation: Zod
- Styling: Tailwind CSS
- UI components: shadcn/ui
- Build / dev server: Vite
- Tests: Vitest
- Lint + format: Biome (no ESLint or Prettier)
- Package manager: pnpm only (never `npm` or `yarn`)
- Hosting: not decided yet; options with pros and cons in `docs/hosting.md`
- Node 24 and pnpm 10.34.9, pinned with Volta (`volta` field of the root `package.json`, requires `VOLTA_FEATURE_PNPM=1`), and enforced by `engines` + `engineStrict`. `.nvmrc` mirrors the Node major version.

## Monorepo structure

```
apps/
  www/          public front end (TanStack Start)
  api/          API (Hono)
  storybook/    Storybook for packages/ui (planned)
packages/
  ui/           shadcn components (use semantic tokens only)
  themes/       Tailwind/shadcn themes: tokens, light/dark variants, no components
  resources/    typed API resources, data access point for the front ends
  schemas/      Zod schemas shared by the API and the front ends (inputs, responses)
  config-ts/    base tsconfig
  utils/        pure utilities, no framework dependency
```


Dependency rules:

- `apps` depend on `packages`; a package never depends on an app.
- An app never imports code from another app. Anything shared goes in a package.
- Only create a new package if at least two apps need it. Until then, keep the code in the app.
- Internal packages are consumed directly as TypeScript source (`exports` pointing to `.ts`), with no build step of their own.
- Internal dependencies are declared with `"workspace:*"`. Shared versions (React, Zod, Vitest...) are centralized in the `catalog:` of `pnpm-workspace.yaml`.
- Internal package alias: `@repo/<package>` (e.g. `@repo/resources`).

## Commands

From the root:

- Install: `pnpm install`
- Dev an app: `pnpm --filter <app> dev`
- Build an app: `pnpm --filter <app> build`
- Build / test / check everything: `pnpm -r build`, `pnpm -r test`, `pnpm -r typecheck`
- Run a single test file: `pnpm --filter <app> test <path/file>`
- Lint + format (whole repo): `pnpm biome check .` (auto-fix: `pnpm biome check --write .`)
- Add a dependency to an app: `pnpm --filter <app> add <package>`

IMPORTANT: after any change, run the typecheck, Biome and the tests of the affected apps and packages before declaring the task done. If the change touches a shared package, also check every app that uses it.

Root shortcuts: `pnpm typecheck`, `pnpm test`, `pnpm build` (recursive), `pnpm check` / `pnpm check:fix` (Biome). Biome ignores `docs/`, Markdown files and generated files.

## Typical front-end app structure (TanStack Start)

- `src/routes/`: TanStack routes (file-based routing)
- `src/components/`: components specific to the app
- `src/features/`: code organized by feature
- `src/server/`: server functions and data access
- `src/lib/`: utilities specific to the app

Shared shadcn components live in `packages/ui`, not in each app.

## Code conventions

- TypeScript: no `any`; prefer `unknown` + narrowing. No `@ts-ignore` without a justifying comment.
- Function components only, one component per file, named in PascalCase; hooks as `useXxx`.
- Props explicitly typed with a named `interface` or `type`.
- Create several small, dedicated components, each with a single responsibility, rather than one big component that does several things. If a component handles several UI blocks or several concerns, split it.
- No business logic in components: extract it into hooks or pure functions.
- Absolute imports through the `@/` alias inside an app, and through `@repo/<package>` between packages. No relative paths that leave the app or package (`../../..`).
- Code style is dictated by Biome: don't debate formatting, run `biome check --write`.
- No new dependency without asking me first.
- Reuse existing components and utilities (including those in `packages/`) before creating new ones.

## TanStack Start (front-end apps)

- Never edit generated files by hand (e.g. `routeTree.gen.ts`).
- Load data in route `loader`s or through server functions, not in `useEffect`.
- Server code (database access, secrets, private environment variables) must never be imported on the client side.
- Validate server function inputs with a Zod schema before using them.
- Type search and route parameters through TanStack Router mechanisms.

## Validation (Zod)

- All data coming from outside (forms, URL parameters, request bodies, third-party API responses, environment variables) is validated with Zod before use.
- Define a schema once and derive the type from it: `type Xxx = z.infer<typeof xxxSchema>`. Don't duplicate the type by hand.
- Schemas shared by the API and the front ends live in `packages/schemas`; don't redefine the same schema in several apps. A schema used by a single app stays in that app.
- The Drizzle schema in `apps/api` is the source of truth for the database and Zod describes the API's inputs and outputs.
- Prefer `safeParse` when the error must be handled; `parse` only when failure should interrupt the flow.
- Validation error messages must be readable by the user for forms.

## UI: Tailwind and shadcn

- Style with Tailwind classes; no custom CSS unless justified.
- Merge conditional classes with `cn()`.
- Add a shadcn component with the CLI (`pnpm dlx shadcn@latest add <component>`) in `packages/ui` rather than copying it by hand.
- Use the semantic tokens from `packages/themes` (`bg-primary`, `text-muted-foreground`...) rather than hard-coded color values. Themes are defined only in `packages/themes`, never in an app or in `packages/ui`.
- Accessibility: semantic elements, labels on fields, visible focus, keyboard navigation.

## Tests

- Every new behavior or bug fix comes with a test.
- Test visible behavior (Testing Library), not implementation details.
- Never delete or disable a test to make CI pass.

## Git

- Long-lived branches:
  - `main`: production. Only receives merges from `stage` (or urgent fixes); every commit is deployable.
  - `stage`: pre-production. Receives merges from `dev` for client validation and final testing in an environment identical to production.
  - `dev`: integration. Working branches are merged here first; deployed to the development environment.
- Working branches: `feature/<topic>` and `fix/<topic>`, created from `dev` and merged back into `dev`. An urgent production fix branches from `main`, then is merged into `main`, `stage` and `dev`.
- Changes flow `dev` → `stage` → `main`, never the other way except for urgent fixes.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:` ...), short and in the imperative; specify the scope with the app or package (e.g. `feat(api): ...`).
- Never push directly to `main` or `stage`; never commit `.env` or secrets.
- No commit or push unless I ask for it.
- At the end of each task, suggest the matching commit message (following the convention above), without committing.

## Way of working

- Read the existing code before changing it; follow the patterns already in place.
- For a change touching more than 3 files or several apps/packages, propose a plan first.
- Make the smallest coherent change; don't refactor what wasn't asked.
- Stay within the app or package concerned; flag any change needed elsewhere rather than making it silently.
- If an instruction is ambiguous, ask rather than guess.
- Clearly flag what couldn't be verified (test not run, behavior not tested in the browser).
- Replies to me in French. Everything written in files is in English: code, comments, test names, identifiers, documentation (README, CHANGELOG, `docs/`, `CLAUDE.md`) and commit messages. User-facing content is the exception: it goes through the i18n system in every supported locale.

## Never do

- Use npm or yarn, or edit `pnpm-lock.yaml` by hand.
- Import an app's code into another app, or make a package depend on an app.
- Disable Biome or TypeScript rules globally.
- Modify generated files or build folders.
- Introduce breaking changes in a shared package without checking and updating every app that uses it.
