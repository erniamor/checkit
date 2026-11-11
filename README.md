# Checkit

A small web app to manage short to-do lists shared between several users: lists synced in real time between their members, sharing by email invitation or share link, and voice input to add items. Available in English (default), French and Spanish.

## Status

| Part | State |
| --- | --- |
| API: foundation, health check | Done |
| API: passwordless sign-in (magic link, email code) | Done; Google ready once OAuth credentials are set |
| API: lists, items, members, role-based access | Done |
| API: sharing (invitations, share links, member management) | Done |
| API: real time (Server-Sent Events) | Done |
| Front end: foundation (header, languages, appearance) | Done |
| Front end: API client (`packages/resources`), sign-in, name at first sign-in | Done |
| Front end: lists and items | Done |
| Front end: real time | Done |
| Front end: sharing | Next |
| Voice input | Planned (browser Web Speech API, server transcription as fallback) |
| Email provider, hosting | Not chosen (see [docs/hosting.md](docs/hosting.md)) |

## Repository

A pnpm monorepo:

| Folder | Content |
| --- | --- |
| [`apps/api`](apps/api) | REST API: Hono, Drizzle, PostgreSQL, Better Auth |
| [`apps/www`](apps/www) | Front end: React, TanStack Start, TanStack Query, Paraglide JS |
| [`packages/schemas`](packages/schemas) | Zod schemas shared by the API and the front ends |
| [`packages/resources`](packages/resources) | Typed API client for the front ends |
| [`packages/ui`](packages/ui) | shadcn/ui components |
| [`packages/themes`](packages/themes) | Tailwind/shadcn themes (tokens, light and dark) |
| [`packages/config-ts`](packages/config-ts) | Shared TypeScript configurations |
| [`packages/utils`](packages/utils) | Pure utilities shared by several projects (empty for now) |
| [`docs`](docs) | Project documentation (hosting options) |

Each app and package has a `README.md` (how to use it) and a `CLAUDE.md` (the rules to follow when working on it). The root [`CLAUDE.md`](CLAUDE.md) holds the conventions of the whole repository.

## Prerequisites

- [Volta](https://volta.sh), which installs the pinned versions of Node (24) and pnpm (10.34.9). pnpm support in Volta needs `VOLTA_FEATURE_PNPM=1` in your shell profile; without it, `pnpm` runs on another Node version and the install fails on `engines`.
- [Docker](https://www.docker.com), for the local PostgreSQL database.

Use pnpm only, never npm or yarn.

## Getting started

```sh
pnpm install

# API: environment, database, migrations
cp apps/api/.env.example apps/api/.env   # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm --filter api db:up
pnpm --filter api db:migrate

# Front end: environment
cp apps/www/.env.example apps/www/.env

# API (http://localhost:3001) and front end (http://localhost:3000) together
pnpm dev
```

Docker must be running: the API needs its database (`pnpm --filter api db:up` starts it).

In development, sign-in emails (links and codes) are printed in the API's console. See [apps/api/README.md](apps/api/README.md) and [apps/www/README.md](apps/www/README.md) for the details.

## Commands

From the root:

| Command | Effect |
| --- | --- |
| `pnpm dev` | Start the API and the front end in parallel, with each line prefixed by its app |
| `pnpm typecheck` | Typecheck every app and package |
| `pnpm test` | Run every test suite (Docker must be running for the API's) |
| `pnpm build` | Build every app |
| `pnpm check` / `pnpm check:fix` | Lint and format with Biome / apply the fixes |
| `pnpm --filter <app> <script>` | Run a script of one app or package |

Run the typecheck, Biome and the tests of what you changed before considering a change done.

## Git

- `main` (production) ← `stage` (pre-production) ← `dev` (integration).
- Work on `feature/<topic>` or `fix/<topic>` branches created from `dev`.
- Commits follow Conventional Commits with the app or package as scope: `feat(api): ...`, `fix(schemas): ...`.
