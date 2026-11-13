# www

Checkit's web app: the screens where users sign in, manage their lists, share them and add items by voice. Built with React and TanStack Start, TanStack Query, Paraglide JS for translations, Tailwind CSS and the components of [`@repo/ui`](../../packages/ui).

**In progress.** For now: a header (logo, then menus for the language, the appearance and the account: profile and sign-out), sign-in by magic link or code, the name asked at the first sign-in, the lists and their items, updated in real time with the other members' changes, sharing (members, invitations, share links), voice input (the browser's recognition, or the API's transcription), a home page for visitors, and the 404 and error pages.

## Screens

| Path | Screen |
| --- | --- |
| `/` | Presentation for visitors; signed-in users go to `/lists` |
| `/sign-in`, `/welcome` | Sign-in, then the name at the first sign-in |
| `/profile` | The user's email, and their name to change |
| `/lists` | My lists: each with its progress and whether it's shared with me; creates a list |
| `/lists/:listId/members` | Members and sharing: the members and their role; for the owner, changing roles, removing members, inviting by email and the share links; for the others, leaving the list |
| `/invitations/:token` | The link of an invitation email: what the invitation offers, then join (with the invited email), sign in, or sign out to switch accounts |
| `/join/:token` | A share link: what it offers, then join or sign in |
| `/items` | All my items: the items of every list, grouped by list, filtered (to do, checked, all) |
| `/offline` | Shown by the service worker when a page can't load without a connection |
| `/lists/:listId` | A list: add (typed, or several at once by voice), check, rename, reorder (drag by the handle, or the keyboard) and delete items (after a confirmation); rename the list; delete it (owner, after a confirmation). Read only for a viewer. Checked items are shown below the others. The other members' changes show up live; if the list is deleted or the user loses access, they're sent back to `/lists` with a toast |

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

In the app installed on an iPhone or iPad, the email's link would open in Safari, whose cookies the app doesn't share: there, the page sends the code directly.

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
| `build` | Production build: a standalone Node server in `.output/` (Nitro) |
| `start` | Runs the production build (`PORT`, 3000 by default) |
| `i18n` | Compiles the messages into `src/paraglide/` (also done by `dev`, `build` and the tests) |
| `typecheck` | Compiles the messages, then checks the types |
| `icons` | Draws the app's icons into `public/` from the logo (`scripts/generate-icons.mjs`, no dependency); run it after changing the logo or its colors |
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

Light, dark or the system's, and one of the themes of `@repo/themes`, chosen in the header's appearance menu. Each choice is stored in a cookie so the server renders the right appearance directly, with no flash on load.

## Voice input

On a list, editors can say several items at once ("milk, eggs and bread") with the microphone button next to the add field. The text shows while it's heard; the items found in it (`splitSpokenItems()`: split on commas and "and", "et", "y"..., articles dropped) are then reviewed, corrected or removed, and added together.

- Recognition is the browser's Web Speech API, in the app's language (the browser's regional variant when it has one, such as `fr-CA`). Chrome and Edge send the audio to Google, Safari to Apple: the app never receives it.
- Where the browser has no speech recognition (Firefox), or can't reach its service (Brave), the microphone is recorded (`MediaRecorder`, 30 seconds at most) and transcribed by the API (`POST /v1/transcriptions`, Mistral). Nothing shows while the user speaks: they press "Done", then the items are reviewed the same way. Without `MISTRAL_API_KEY` on the API, those browsers show that voice input isn't available.

## Installable app (PWA)

The app can be installed on a phone or a computer, and opens on `/lists` in its own window.

- `/manifest.webmanifest?lang=<locale>`: the manifest, in the page's language (a server route, `src/routes/manifest[.]webmanifest.ts`).
- `public/`: the icons (`icons` script) and the service worker, `sw.js`. The service worker keeps the build's files (hashed names) and shows `/offline` when a page can't load; it never caches pages or API data. It's only registered by production builds: check it with `build` then `start`.
- Installing: Chromium browsers (Android, Chrome and Edge on computers) show their own dialog from the app's "Install" button. iPhones and iPads can't be prompted: the app explains the Share menu's "Add to Home Screen". The offer is a card on "My lists" ("Not now" hides it for 30 days on the device) and an item of the account menu, both hidden once installed.
- `<meta name="theme-color">` follows the theme and the mode: the installed app's bars take the header's color.

## Deployment

Built by Nitro into a standalone Node server (`.output/server/index.mjs`), deployed on Railway: see [docs/deployment.md](../../docs/deployment.md). `VITE_API_URL` is read at build time.
