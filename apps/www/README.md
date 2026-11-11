# www

Checkit's web app: the screens where users sign in, manage their lists, share them and add items by voice. Built with React and TanStack Start, TanStack Query, Paraglide JS for translations, Tailwind CSS and the components of [`@repo/ui`](../../packages/ui).

**In progress.** For now: a header (logo, language and appearance selectors, the signed-in user and sign-out), sign-in by magic link or code, the name asked at the first sign-in, the lists and their items, updated in real time with the other members' changes, sharing (members, invitations, share links), a home page for visitors, and the 404 and error pages. Voice input comes next.

## Screens

| Path | Screen |
| --- | --- |
| `/` | Presentation for visitors; signed-in users go to `/lists` |
| `/sign-in`, `/welcome` | Sign-in, then the name at the first sign-in |
| `/lists` | My lists: each with its progress and whether it's shared with me; creates a list |
| `/lists/:listId/members` | Members and sharing: the members and their role; for the owner, changing roles, removing members, inviting by email and the share links; for the others, leaving the list |
| `/invitations/:token` | The link of an invitation email: what the invitation offers, then join (with the invited email), sign in, or sign out to switch accounts |
| `/join/:token` | A share link: what it offers, then join or sign in |
| `/lists/:listId` | A list: add, check, rename and delete items; rename the list; delete it (owner, after a confirmation). Read only for a viewer. Checked items are shown below the others. The other members' changes show up live; if the list is deleted or the user loses access, they're sent back to `/lists` with a toast |

The app calls the API through [`@repo/resources`](../../packages/resources): it needs the API running (see [apps/api/README.md](../api/README.md)).

## Environment

Copy `.env.example` to `.env`:

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Public URL of the API, called by the browser (exposed to the client) |
| `API_URL` | Optional: URL of the API for the server's requests during rendering (e.g. an internal address). Defaults to `VITE_API_URL`. Read from the process environment, not from `.env` |

## Sign-in

1. `/sign-in`: the user enters their email and receives a magic link, which brings them back to the page they asked for (`?redirect=`).
2. If the link doesn't work for them (another device, for example), "Get a code instead" emails a 6-digit code to enter on the page.
3. At the first sign-in, `/welcome` asks for their name, shown to the people they share lists with.

Pages reserved to signed-in users live under `src/routes/_authenticated/`: visitors are sent to `/sign-in`, then brought back.

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
