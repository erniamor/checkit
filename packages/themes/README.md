# @repo/themes

Tailwind v4 / shadcn themes: values only (colors, fonts, radii), no components.

## Usage

In the app's main stylesheet, in this order:

```css
@import "tailwindcss";
@import "@repo/themes/base.css";
@import "@repo/themes/brand.css";
@import "@repo/themes/neutral.css"; /* only if the theme should be selectable */
```

- Theme: `data-theme="<name>"` attribute on `<html>`. Without the attribute, the `brand` theme applies.
- Dark mode: `dark` class on `<html>`, independent of the theme.
- Fonts: the theme declares the families (`--typeface-body`, `--typeface-heading`); the app loads them.

## Tokens

shadcn semantic variables (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, with their `-foreground`, plus `border`, `input`, `ring`, `radius`), and project tokens:

| Token | Role | Utilities |
| --- | --- | --- |
| `--inverse`, `--inverse-foreground` | Contrasting band (header, footer) | `bg-inverse`, `text-inverse-foreground` |
| `--inverse-muted-foreground` | Secondary text on the band | `text-inverse-muted-foreground` |
| `--inverse-border` | Separators on the band | `border-inverse-border` |
| `--typeface-body`, `--typeface-heading` | Font families | `font-sans`, `font-heading` |

All colors are hexadecimal (sRGB).

## Themes

### `brand` (default)

Placeholder for the product's identity: replace its values with the project's colors, fonts and radius, keeping the contrasts checked by the tests.

- Primary: `#1d4ed8` (blue), white text
- Text: `#09090b` on `#ffffff`, secondary text `#52525b`
- Band: `#18181b`, text `#fafafa` / `#a1a1aa`
- Fonts: system fonts; if the project uses web fonts, declare them here and load them in the app
- Radius: `0.5rem`
- Dark mode: the blue is lightened to `#60a5fa` and primary button text turns dark.

### `neutral` (reference)

Based on shadcn/ui's neutral theme, in pure grays with system fonts and a `0.625rem` radius. A reference to check that `packages/ui` components don't depend on the `brand` theme. Two values differ from shadcn to meet WCAG AA in light mode: `--muted-foreground` (`#6b6b6b` instead of `#737373`) and `--ring` (`#8a8a8a` instead of `#a1a1a1`).

## Verified contrasts

`pnpm --filter themes test` checks, for each theme and each mode, that every token is defined and that these pairs meet WCAG AA: text ≥ 4.5:1 (`background`/`foreground`, `background`/`muted-foreground`, `background`/`primary`, each surface with its `-foreground`, `inverse` with both its texts), focus ring ≥ 3:1 on `background`.

Not checked: the field border (`--input`).
