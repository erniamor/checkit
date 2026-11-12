# CLAUDE.md : apps/www

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to this front-end application. The backend has its own file (`apps/api`).

## Role

Checkit's web app, for the people who keep shared to-do lists: sign-in, lists and their items, sharing, real-time updates and voice input. Consumes the API of `apps/api` (REST and Server-Sent Events) through `@repo/resources`.

## App-specific stack

- React + TanStack Start (file-based routing, loaders, server functions), on Vite 8, built for Node by Nitro (`nitro/vite`), served on `http://localhost:3000` in development
- Server state: TanStack Query, wired to the router with `@tanstack/react-router-ssr-query` (data loaded during server rendering is handed to the browser's cache)
- Data: the Hono API (`apps/api`) through `@repo/resources`
- Validation: Zod schemas from `@repo/schemas`, shared with the API
- i18n: Paraglide JS 2.9 (see "Languages")
- UI: components from `@repo/ui` (shadcn) and the themes of `@repo/themes`; icons from `lucide-react` (version shared with `@repo/ui` through the `catalog:`)
- Tests: Vitest (jsdom) and Testing Library

## Commands

- Dev: `pnpm --filter www dev` (fails if port 3000 is taken, rather than taking the API's 3001; copy `.env.example` to `.env` first)
- Build: `pnpm --filter www build` (a standalone Node server in `.output/`, built by Nitro); run it with `pnpm --filter www start`
- Tests: `pnpm --filter www test`
- Typecheck: `pnpm --filter www typecheck` (compiles the messages first, through the `i18n` script)

## Structure

- `src/routes/`: TanStack routes; one file per route, thin (loader + page component). `__root.tsx` renders the HTML document, the header and the appearance, and loads the signed-in user. `_authenticated.tsx` is the layout of the pages reserved to signed-in users (`_authenticated/*`).
- `src/features/<feature>/`: components, hooks and logic specific to a feature (`appearance` (mode), `theme`, `items` (the page of all the user's items, `/items`), `auth` (with `UserMenu`, the header's account menu), `profile` (`NameForm`, shared by `/welcome` and `/profile`), `lists`, `sharing`, `i18n`, `home`)
- `src/components/`: generic components specific to this app (`Header`, `Logo`, `header-styles.ts` (`headerButtonClass`, for buttons on the header's band), `SelectField` (`tone`: `inverse` or `default`), `TextField`, `InlineEditForm`, `ConfirmButton` (an action confirmed in a dialog, as text or as an icon), `IconButton` (icon only, with an `aria-label` and a tooltip), `WithTooltip`, `FormAlert`, `Loading`, `NotFound`, `ErrorView`; shared components go in `packages/ui`)
- `src/server/`: server-only code (`env.ts`: the server's API URL)
- `src/lib/`: utilities specific to the app (`api.ts`: the API client; `error-messages.ts`: error codes to messages; `redirect.ts`: the safe `redirect` search parameter; `cookies.ts`)
- `src/env.ts`: public environment variables (`VITE_*`), validated with Zod
- `src/test/`: test helpers (`setTestLocale()`, `renderWithRouter()`, `renderWithQueryClient()`, `mockApi()` (its `respond` also gets the full URL, to read the query string), `fakeListServer()`: an in-memory API for one list, with `other.*` for another member's changes, `FakeEventSource`: drives the real-time stream, `mockSystemAppearance()`)
- `src/router.tsx`: creates the router and the `QueryClient`
- `src/server.ts`: server entry; runs Paraglide's middleware around TanStack Start's handler
- `src/styles.css`: Tailwind, the themes and `@repo/ui`'s styles
- `messages/<locale>.json`: the translations; `project.inlang/`: Paraglide's configuration
- `src/routeTree.gen.ts` (committed) and `src/paraglide/` (ignored): generated, never edit

## Languages

- English (`en`, default), French (`fr`) and Spanish (`es`). Every user-facing text is a message in `messages/<locale>.json`, present in all three files, used as `m.<key>()` from `@/paraglide/messages`.
- The locale isn't in the URL: it comes from the `PARAGLIDE_LOCALE` cookie (the user's choice in the header), then the browser's language, then English. On the server, `src/server.ts` detects it for each request.
- The language is chosen in the header's menu (`LanguageMenu`). Changing it calls `setLocale()`, which stores the cookie and reloads the page.
- The language names in the selector are written in their own language (`Français`), the same in every locale.
- The Paraglide options are set twice, in `vite.config.ts` and in the `i18n` script of `package.json`: keep them in sync.
- In tests, `setTestLocale(locale)` renders the messages in a given locale.

## Appearance

- The header's appearance menu (`AppearanceMenu`, whose icon shows the current mode) holds two choices: the mode (`ModeRadioGroup`) and the theme (`ThemeRadioGroup`).
- Mode: light, dark or system, stored in the `appearance` cookie. `getAppearance()` reads it on the server and in the browser; the root route renders the `dark` class on `<html>` so the page doesn't flash.
- With "system", the server can't know the system's appearance: a small inline script sets the class before the first paint, and `<html>` has `suppressHydrationWarning` for that reason.
- Theme: one of the themes offered by `@repo/themes` (`themes`), stored in the `theme` cookie, read on the server (`getTheme()`) and rendered as `data-theme` on `<html>`: no flash. A missing or no longer offered theme falls back to the default one (`stationery`).
- `styles.css` imports every offered theme; a theme added to `@repo/themes` needs its import there and its label (`themeLabels`, `theme_<name>` messages).
- The choices are kept per device (cookies), not in the account.

## API and session

- Every call goes through `getApi()` (`src/lib/api.ts`), the resources of `@repo/resources`. In the browser it calls the API directly with the session cookie (`credentials: "include"`); during server rendering it forwards the incoming request's cookie. Both send the app's language as `Accept-Language`.
- The signed-in user is the `me` query (`features/auth/me-query.ts`): `null` for a visitor. The root route loads it and puts it in the route context (`context.me`), used by the header and the routes' checks.
- After signing in, out or changing the profile, call `useSessionChange()` (`refresh` or `clear`): it updates the `me` query, re-runs the routes' checks and navigates.
- A page reserved to signed-in users goes under `src/routes/_authenticated/`. A signed-in user without a name is sent to `/welcome` first (root route).
- A `redirect` search parameter is always parsed with `redirectSearchSchema`: only internal paths are kept, so a link can't send users to another site.
- Query options and keys (`queryOptions`) live in the features, not in `@repo/resources`.

## Lists

- Query options and keys are in `features/lists/queries.ts` (`listKeys`): `["lists"]`, `["lists", listId]`, `["lists", listId, "items"]`, and `["lists", "all-items", status]` for the page of all items. Invalidating `["lists"]` reloads everything about the lists.
- `/items` shows the items of all the user's lists, grouped by list, filtered by the `status` search parameter (`open` by default, `checked`, `all`). Items can only be checked or unchecked there (if the role allows it); the rest is done in the list. It has no real-time stream: it reloads when the user comes back to it.
- Item changes and the list's renaming are optimistic (`use-list-mutations.ts`): the cache is updated at once, rolled back if the API refuses, then reloaded. Validate the input with its schema (`validateField()`) before an optimistic change, so an invalid value never shows.
- The actions shown follow the role (`permissions.ts`); the API enforces it anyway.
- One page of data: 100 lists, 200 items per list (`LISTS_PAGE_SIZE`, `ITEMS_PAGE_SIZE`). Add a "load more" before raising them.

## Real time

- The list's page listens to its stream with `useListEvents(listId, meId)` (`lists.subscribe` of `@repo/resources`), in a `useEffect`: it syncs with an external system. Never subscribe during server rendering.
- `applyListEvent()` (pure, tested) turns an event into a cache change. My own `items.created` reloads the items instead, since my optimistic addition already shows them with a temporary id.
- If a load of the list is in progress when an event arrives, reload instead of patching: the load started before the change and would overwrite the patch.
- Every `ready` (connection and reconnection) reloads the list: missed events aren't replayed.
- A deleted list, or a lost access, leaves the page for `/lists` with a toast.

## Sharing

- A list's pages live under `routes/_authenticated/lists/$listId/`: `route.tsx` is their layout (checks the list exists, wraps them in `ListLive` for real time), `index.tsx` the items, `members.tsx` the members and sharing. Their loaders go through `orListNotFound()`, so a 404 shows "list not found".
- `/invitations/$token` and `/join/$token` are public: their loader loads the preview with `loadPreview()` (unknown token: 404; expired or revoked: `preview: null`). Joining always needs a click on "Join the list", never just opening the link.
- A share link's URL is built by the front end: `<origin>/join/<token>` (`shareLinkUrl()`).
- Invitations and share links are only loaded for the owner: the API refuses them to the others.
- The header's bell (`InvitationsMenu`, a `Popover`) lists the invitations sent to the signed-in user, to accept or decline them without the email. They're checked on load, when the tab gets the focus again, and every minute (`receivedInvitationsQueryOptions`, key `["me", userId, "invitations"]`, per user so another account never sees them); there's no real-time stream for them.

## Icons and tooltips

- Icons come from `lucide-react`, always `aria-hidden`: the control carries the text.
- An icon-only control has an accessible name (`aria-label`, which can be more precise than its tooltip: "Rename “Milk”" for "Rename") and a tooltip (`IconButton`, `WithTooltip`). Tooltips don't show on touch screens, so they never hold information found nowhere else.
- One `TooltipProvider` wraps the app in the root route, and the components rendered by the test helpers.

## Toasts

- One `<Toaster />` in the root route; call `toast` from `@repo/ui` for a message that must survive a navigation or doesn't belong to a form. Errors about a form stay next to it (`FormAlert`, field errors).

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

- Each form has a Zod schema from `@repo/schemas`, used on the client for UX and by the API for security.
- Show validation errors next to the relevant field, with a readable message: schema messages are error codes (`list_name_required`), translated through the i18n system.
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
- Mock the API at the `resources` or network level; don't call a real API in tests. In practice: `vi.mock("@/lib/api", () => ({ getApi: vi.fn() }))` in the test file, then `mockApi(respond)` answers the requests and returns them.

## Never do

- Modify `routeTree.gen.ts` or any generated file.
- Import code from another app, or from `src/server/` into a client component.
- Expose a private environment variable to the client; only explicitly public variables may be exposed.
- Duplicate a Zod schema or a type already present in `packages/schemas` or `packages/resources`.
- Bypass authentication or authorization on the client side assuming they aren't checked on the server: they must be enforced in the backend (the middlewares of `apps/api`).
