# CLAUDE.md : apps/www

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to this front-end application. The backend has its own file (`apps/api`).

## Role

<One sentence: what this app does, who it is for, and what data it consumes (backend API, third-party services).>

## App-specific stack

- React + TanStack Start (file-based routing, loaders, server functions)
- Data: the Hono API (`apps/api`) through `@repo/resources`
- Validation: Zod schemas exported by `@repo/resources`
- UI: components from `@repo/ui` (shadcn) and themes from `@repo/themes`
- <Add here: server state management (TanStack Query), forms (TanStack Form | React Hook Form), i18n, analytics...>

## Commands

- Dev: `pnpm --filter www dev`
- Build: `pnpm --filter www build`
- Tests: `pnpm --filter www test`
- Typecheck: `pnpm --filter www typecheck`

## Structure

- `src/routes/`: TanStack routes; one file per route, thin (loader + page component)
- `src/features/<feature>/`: components, hooks and logic specific to a feature
- `src/components/`: generic components specific to this app (shared components go in `packages/ui`)
- `src/server/`: server functions (data access, secrets)
- `src/lib/`: utilities specific to the app
- `src/routeTree.gen.ts`: generated, never edit

<Adapt to the real structure.>

## Routes and data

- A route defines its `loader` to load data; the page component doesn't `fetch` in a `useEffect`.
- Path and search parameters are typed and validated with Zod in the route definition.
- Handle the three states on each page: loading, error, empty data. Use the routes' error and pending components.
- API calls go through `@repo/resources`, never through a hand-written `fetch` in a component.
- Authentication-related redirects happen in the route's `beforeLoad`, not in the component.

## Components

- A page is an assembly of small, dedicated components: the route composes, the components in `features/` render.
- A component used by several apps moves to `packages/ui`; as long as only this app uses it, it stays here.
- Presentational components receive typed props and don't call the API themselves; data fetching happens in the route or in a dedicated hook.
- No `useEffect` to derive state or load data; use it only to synchronize with an external system.
- Memoization (`useMemo`, `useCallback`, `memo`) only if a performance problem has been measured.

## Forms

- Each form has a Zod schema from `@repo/resources`, used on the client for UX and on the server for security.
- Show validation errors next to the relevant field, with a readable message.
- Disable the submit button during submission and show the result (success or error).
- Every field has an associated `label`.

## Styling and accessibility

- Tailwind classes only; use the semantic tokens from `@repo/themes`, no hard-coded colors. The app imports `base.css` and the desired themes in its main stylesheet, declares `@source` for `packages/ui`, and doesn't redefine tokens.
- Responsive design: mobile first, then Tailwind breakpoints.
- Semantic HTML elements (`button`, `nav`, `main`, `h1` to `h6` in order), keyboard navigation, visible focus, alt text on images.
- The theme and dark mode are stored in a cookie read on the server and applied to `<html>` during server rendering, not in `localStorage`, to avoid flashes and hydration errors.
- Check the rendering in light and dark for each theme offered.

## Performance

- Lazy-load heavy routes and components.
- Size and optimize images; don't import a whole library for a single function.
- Don't block rendering on data that isn't essential to the initial display.

## Tests

- Test components with Vitest and Testing Library, from the user's point of view (roles, labels, visible text).
- Prioritize testing forms, `features/` logic and error cases.
- Mock the API at the `resources` or network level; don't call a real API in tests.

## Never do

- Modify `routeTree.gen.ts` or any generated file.
- Import code from another app, or from `src/server/` into a client component.
- Expose a private environment variable to the client; only explicitly public variables may be exposed.
- Duplicate a Zod schema or a type already present in `packages/resources`.
- Bypass authentication or authorization on the client side assuming they aren't checked on the server: they must be enforced in the backend (the middlewares of `apps/api`).
