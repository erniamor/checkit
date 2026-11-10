# CLAUDE.md : packages/ui

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to the shared components package.

## Role

The monorepo's shared design system: shadcn/ui components and reusable composed components. It uses semantic tokens only and defines no theme: themes (colors, typography, spacing) live in `packages/themes`. Consumed by all apps (`apps/*`).

## Package-specific stack

- shadcn/ui, style `radix-nova` (components copied into the code, based on Radix UI through the `radix-ui` package) and Tailwind CSS v4
- `class-variance-authority` for variants, `cn()` from the official `cn` package (replaces clsx + tailwind-merge) to merge classes
- Icons: `lucide-react`
- Animations: `tw-animate-css`, imported by `src/styles/globals.css`
- Tests: Vitest + Testing Library
- Documentation: Storybook, hosted in a dedicated app (`apps/storybook`). Stories (`*.stories.tsx`) live next to their components in this package; the app only holds the Storybook configuration and loads the themes.

## Commands

- Tests: `pnpm --filter ui test`
- Typecheck: `pnpm --filter ui typecheck`
- Add a shadcn component: `pnpm dlx shadcn@latest add <component>` (from this package, with the package's `components.json`)
- Storybook: `pnpm --filter storybook dev` (once `apps/storybook` exists)

## Structure

- `src/components/ui/`: base shadcn components (button, input, dialog...)
- `src/components/`: composed components built from the base components
- `src/lib/`: pure utilities specific to the package (`cn()` comes from the `cn` package, not from here)
- `src/hooks/`: reusable UI hooks
- `src/styles/globals.css`: minimal global styles and the package's animations (never tokens or themes, which live in `packages/themes`), exported as `@repo/ui/styles.css`
- `src/index.ts`: the package's public API (what is exported here is the contract)


## Package rules

- The package depends on no app and contains no business logic or network calls. Components receive everything through props.
- A component only enters this package if it is used by at least two apps, or if it is one of the design system's base components.
- Apps import only from `@repo/ui` (`src/index.ts`) and `@repo/ui/styles.css`; they never import internal paths.
- Inside the package, files import each other through the package name (`@repo/ui/components/ui/button`), following the shadcn monorepo convention set in `components.json`. That is why `exports` also exposes `./components/*`, `./lib/*` and `./hooks/*`; these subpaths are for the package itself, not for the apps. Don't use `#` subpath imports: the shadcn CLI doesn't resolve them.
- Consumed as TypeScript source (`exports` pointing to `.ts`), with no build step of its own.
- Component dependencies (React, Radix, etc.) are declared as `peerDependencies` when relevant, with the versions from the `catalog:`.

## Component conventions

- Typed function components, explicit props, one component per file, in PascalCase.
- Several small, dedicated components rather than one big multi-purpose component: compose rather than multiply props.
- Forward the element's native props (`React.ComponentProps<"button">`, etc.) and accept a `className` merged with `cn()`.
- Use `forwardRef` or `ref` passing depending on the React version in use, consistently with the existing shadcn components.
- Variants with `cva`, named semantically (`variant`, `size`), no ad hoc combinations through `className` in the apps.
- Components don't modify global styles and have no side effects on import.

## Theme and styling

- All colors, radii, shadows and spacing go through the semantic tokens provided by `packages/themes` (`bg-primary`, `rounded-md`...). No hard-coded color in a component, and no reference to a specific theme.
- This package defines no theme and doesn't depend on `packages/themes`: the apps import the themes' CSS. If a component needs a new token, add it in `packages/themes` (in all themes), not here.
- Components work with any theme and in both light and dark, with no per-component exceptions.
- Tailwind only; no custom CSS except for animations that can't be expressed as classes.

## shadcn components

- Add a component through the shadcn CLI in this package, then export it from `src/index.ts`.
- shadcn components are project code: they can be adapted, but keep their API and accessibility behavior (Radix) unless there is a clear reason.
- Don't modify a base component for a one-off need of a single app; compose a new component from it.
- When updating a component from shadcn, review the diff so the project's adaptations aren't lost.

## Accessibility

- Keep the roles, ARIA attributes and keyboard handling provided by Radix.
- Visible focus, sufficient contrast, labels associated with fields, `aria-label` on icon-only buttons.
- Interactive components are usable with the keyboard alone.

## Tests

- Test interaction and accessibility behavior (roles, labels, keyboard) with Testing Library, not CSS classes.
- Every new composed component or variant comes with a test or a story.

## Changes and compatibility

- Modifying or removing a prop, a variant or an export changes the contract for all apps: list the usages in `apps/` (repository search) and update them in the same change.
- Prefer adding a new optional prop or variant over changing existing behavior.
- A component that requires a new token means filling it in across all themes in `packages/themes` in the same change.

## Never do

- Import code from `apps/` or reference it.
- Add business logic, API calls or global state to a design system component.
- Hard-code colors or sizes instead of using tokens.
- Define or redefine a theme here, or import a specific theme: that is the role of `packages/themes` and the apps.
- Import from another package's internal path instead of its public API.
- Break the package's public API without updating all consumers.
