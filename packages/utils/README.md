# @repo/utils

Small pure functions shared by several apps or packages: formatting, string and array helpers, typing helpers. No framework, browser or Node dependency.

**Empty for now.** A function only moves here once at least two projects of the monorepo use it; until then it stays in the app's `src/lib/`.

## Usage

```ts
import { someHelper } from "@repo/utils";
```

Add it to a project with `"@repo/utils": "workspace:*"`. It is consumed as TypeScript source, with no build step.

## Scripts

`pnpm --filter utils test`, `pnpm --filter utils typecheck`.
