# CLAUDE.md : packages/config-ts

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to the shared TypeScript configuration package.

## Role

The monorepo's base TypeScript configuration: a small number of `tsconfig` files that each app and package extends. It guarantees the same strict options everywhere and avoids copy-pasting full `tsconfig` files.

This package contains only JSON configuration files, no code.

## Contents

- `base.json`: options common to the whole monorepo (`strict`, module resolution, target, extra checks). No DOM, no file emission. Extended directly by packages consumed as source without UI or DOM (`utils`).
- `react.json`: extends `base.json` for browser code (JSX, DOM libraries). Used by `apps/www`, `packages/ui`, `packages/resources` and `packages/themes` (TypeScript part).
- `node.json`: extends `base.json` for Node code without DOM (ES2024, Node types). Used by `apps/api`, which must declare `@types/node` in its own `devDependencies`.
- `package.json`: with `exports` and `files` listing these files

Don't create one file more than necessary.

## Package rules

- The package contains only configuration files. No code, no application dependencies.
- It depends on no app and no other internal package.
- It contains no `paths` or import aliases: aliases (`@/`) are specific to each app and are declared in the app's `tsconfig`.
- It contains no `include`, `exclude` or `outDir`: these paths are relative to the project that extends the configuration and are declared in its own `tsconfig`.
- The Biome configuration doesn't live here: it is at the repository root (`biome.json`).
- An app or package extends the configuration by name, never by relative path: `"extends": "@repo/config-ts/react.json"`.
- The package is declared as a `devDependency` with `"workspace:*"` in each project that uses it.

## Options to keep (and why)

Exact values should be checked against the TypeScript version in the `catalog:`. Intentions:

- `strict: true`: mandatory everywhere, no exceptions.
- `noUncheckedIndexedAccess: true`: index accesses return `T | undefined`, which avoids runtime errors.
- `noImplicitOverride`, `noFallthroughCasesInSwitch`: cheap extra checks.
- `verbatimModuleSyntax: true` and `isolatedModules: true`: explicit type imports (`import type`), compatible with Vite and its tooling.
- `moduleResolution: "Bundler"` and `module: "ESNext"`: suited to Vite and TanStack Start.
- A recent `target` (ES2022 or later) consistent with the Node version and the targeted browsers.
- `skipLibCheck: true`: speeds up the typecheck and avoids errors coming from dependencies.
- `noEmit: true`: Vite and the API's bundler produce the code; `tsc` is only used to check types.
- `jsx: "react-jsx"` in `react.json` only.

## Usage in an app or package

Example of an app's `tsconfig.json`:

```json
{
  "extends": "@repo/config-ts/react.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- Each project's `typecheck` is `tsc --noEmit` (or the tool-specific variant, `tsc -p ... --noEmit`).
- Each project points to the most specific file it needs (`react`, `node` or `library`), not always `base`.

## Compatibility

- Any change to an option affects every project that extends the file: a stricter option can make the typecheck fail across several apps and packages.
- Before changing an option, run `pnpm -r typecheck` and fix or flag all failures in the same change.
- Tightening an option is a potential breaking change; flag it in the commit message.
- Never loosen an option (for example disabling `strict` or one of its variants) to make a typecheck pass: fix the code.

## Tests

- No unit tests. Verification is `pnpm -r typecheck` at the root after any change.
- Check at least one project of each type (app, library package) when adding or modifying a configuration file.

## Never do

- Add code, application dependencies or project-specific paths.
- Disable `strict` or any of its checks, globally or for one project, without an explicit request.
- Make a `tsconfig` extend by relative path (`../../packages/config-ts/...`).
- Modify the configuration to work around a type error instead of fixing the code.
- Import from `apps/` or from another internal package.
