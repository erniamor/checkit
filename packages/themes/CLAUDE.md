# CLAUDE.md : packages/themes

> Complements the root `CLAUDE.md`, which also applies here. Contains only the rules specific to the themes package. This package is designed so it can later be extracted into its own repository (see "Future extraction").

## Role

Defines the product's appearance as values, with no components: color, radius, shadow, typography and spacing tokens, wired to Tailwind and to shadcn's semantic variables. One theme = one CSS file that fills in these tokens, in light and dark variants.

It makes it possible to:
- separate appearance (here) from components (`packages/ui`);
- offer several themes to the users, and present new variants before adding them;
- prepare a theme library reusable in other projects.

Consumed by `apps/www`. `packages/ui` doesn't depend on it: its components use semantic tokens only.

With a single front end, this package doesn't exist to share code between apps but for separation of responsibilities, the themes offered to users, and future extraction (see below).

## Package-specific stack

- Plain CSS with Tailwind CSS v4 (CSS-first configuration: `@theme inline` and `@custom-variant` in `base.css`)
- Colors in hexadecimal (sRGB) in every theme
- shadcn semantic CSS variables (`--background`, `--foreground`, `--primary`, `--radius`...)
- TypeScript only for `index.ts` (theme list and types)
- No runtime dependency, no dependency on another monorepo package

## Commands

- Typecheck: `pnpm --filter themes typecheck`
- Tests: `pnpm --filter themes test` (consistency and WCAG AA contrast checks, see "Tests")

## Structure

- `src/base.css`: Tailwind mapping (`@theme inline`) from the semantic variables to Tailwind utilities. Common to all themes.
- `src/themes/<name>.css`: one standalone file per theme, with its light and dark variants: `stationery.css` (default theme), `synthwave.css`, `garden.css`, `brutalist.css`, and `neutral.css` (from shadcn's neutral theme, also the reference theme)
- `src/index.ts`: list of themes offered to users (`themes`), `ThemeName` type, default theme
- `README.md`: intent and characteristics of each theme (main colors, usage, verified contrasts)


## Package rules

- The package depends on no app and no other internal package, and knows none of them. This is a condition for its future extraction.
- Values only: no components, no React hooks, no logic. The theme switcher (React component) lives in `packages/ui` or in the app.
- Nothing project-specific in theme files: no brand name, asset path or reference to an app.
- Each theme is standalone: it can be imported alone with `base.css`, without depending on another theme.
- Apps import `base.css` and the desired themes; they don't redefine tokens locally, except for a justified, commented exception.
- Only what is exported by `src/index.ts` and by the `exports` of `package.json` (CSS files included) is usable; no imports of internal paths.
- Consumed as-is (source), with no build step of its own.

## Token vocabulary

- The vocabulary is fixed and shared by all themes: shadcn's semantic variables, plus the project's own tokens declared in `base.css`.
- Every theme fills in exactly the same variables, in light and dark. An incomplete theme is an error.
- Adding a token means filling it in across all themes in the same change; removing or renaming a token is a breaking change (see "Compatibility").
- Limit the number of tokens: only add one for a real, recurring need, not for an isolated case.
- Name tokens by role (`--primary`, `--muted-foreground`), never by value (`--blue-500`) or by component.

## Theme conventions

- A theme is selected by the `data-theme="<name>"` attribute on `<html>`; dark mode by the `.dark` class on `<html>`. The two axes are independent.
- Each theme defines its light and dark values; a theme without a dark variant is forbidden.
- The default theme (`defaultTheme` in `src/index.ts`, currently `stationery`) is the product's, used when no attribute is present: its selectors are `:root:not([data-theme])` and `[data-theme="<name>"]`. Other themes only apply through their attribute.
- Use consistent color spaces across themes (for example all in `oklch` or all in `hsl`), not a mix.
- Contrast: normal text ≥ 4.5:1 and large text ≥ 3:1 (WCAG AA), for every background/text pair, in every theme and every mode.
- Typography: fonts referenced through variables (`--font-sans`...), loaded by the app; the theme doesn't load a font itself.

## Themes offered to users

- Users choose among all the themes listed in `themes` (the app's appearance menu). Every listed theme is therefore a product theme: complete, documented in `README.md`, and checked visually.
- A theme is named after its idea (`garden`), never after a value or a brand.
- New variants under evaluation are complete, standalone files named plainly (`variant-a`, `variant-b`), presented in development or staging only; once kept, give them a real name and add them to `themes`; delete the rejected ones, don't leave them dead in the repository.
- Removing or renaming an offered theme is a breaking change: the apps fall back to the default theme for a stored choice that no longer exists.

## SSR (TanStack Start)

- The chosen theme is stored in a cookie read on the server and applied to `<html>` during server rendering. No `localStorage` as the source of the theme: it causes a flash of the wrong theme or a hydration error.
- Dark mode follows the same rule (cookie, with a fallback to the system preference).

## Tailwind in the monorepo

- Each app declares the sources to scan (`@source`) to include the classes used in `packages/ui`.
- The package's CSS is imported from each app's main stylesheet, in this order: Tailwind, `base.css`, then the themes.

## Future extraction

The goal is to be able to move this package into a dedicated repository (private registry or GitHub Packages, or a shadcn registry) once a second project needs it. Not before: with a single project, the truly common vocabulary isn't known yet.

To keep the extraction simple:
- follow the independence rules above;
- document each theme in `README.md`;
- keep a `CHANGELOG.md` of token additions, renames and removals.

## Compatibility

- Token and theme names are a contract for all apps and for `packages/ui`.
- Adding a token or a theme is risk-free. Renaming or removing a token, or changing the semantics of an existing token, is a breaking change: search for its usages in `packages/ui` and `apps/`, and update everything in the same change.
- A value change in the default theme (color, radius, spacing) affects the whole product: flag it explicitly.

## Tests

- Consistency test: all themes fill in exactly the same variables, in light and dark.
- Contrast test: key background/text pairs meet the WCAG AA thresholds in every theme and every mode.
- Visual check of a typical page of each app with each theme before shipping a new theme.

## Never do

- Import from `apps/` or from another internal package.
- Add components, logic JavaScript or dependencies on React.
- Hard-code project-specific elements (brand, assets) in a theme.
- Ship an incomplete theme, one without a dark variant, or one with insufficient contrast.
- Store the theme only in `localStorage`, or offer users a variant still under evaluation.
- Rename or remove a token without updating all its consumers.
