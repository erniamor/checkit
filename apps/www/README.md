# www

Checkit's web app: the screens where users sign in, manage their lists, share them and add items by voice. Built with React and TanStack Start, TanStack Query, Paraglide JS for translations, Tailwind CSS and the components of [`@repo/ui`](../../packages/ui).

**In progress.** For now, the app has its foundation: a header (logo, language and appearance selectors), a home page, and the 404 and error pages. It doesn't call the API yet: that comes with [`@repo/resources`](../../packages/resources).

## Development

```sh
pnpm --filter www dev   # http://localhost:3000
```

`http://localhost:3000` is the origin the API allows in development (`CORS_ORIGINS` of `apps/api`).

## Scripts

| Script | Effect |
| --- | --- |
| `dev` | Development server on port 3000 |
| `build` | Production build into `dist/` |
| `i18n` | Compiles the messages into `src/paraglide/` (also done by `dev`, `build` and the tests) |
| `typecheck` | Compiles the messages, then checks the types |
| `test` | Runs the tests (Vitest, jsdom) |

Run them from the repository root with `pnpm --filter www <script>`.

## Languages

English (default), French and Spanish. The texts are in `messages/en.json`, `messages/fr.json` and `messages/es.json`: add every new key to the three files, then use it as `m.key()`:

```tsx
import { m } from "@/paraglide/messages";

<h1>{m.home_title()}</h1>
```

The language isn't part of the URL. It comes from the user's choice (a cookie set by the header's selector), otherwise from the browser's language, otherwise English. Compiling the messages downloads Paraglide's plugins from jsdelivr the first time, so it needs network access.

## Appearance

Light, dark or the system's, chosen in the header. The choice is stored in a cookie so the server renders the right appearance directly, with no flash on load.

## Not set up yet

- Running the production build on a Node server: TanStack Start needs a hosting adapter (Nitro for a Node server), to choose with the hosting (see [docs/hosting.md](../../docs/hosting.md)).
