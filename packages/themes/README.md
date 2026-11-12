# @repo/themes

Tailwind v4 / shadcn themes: values only (colors, fonts, radii), no components.

## Usage

In the app's main stylesheet, in this order:

```css
@import "tailwindcss";
@import "@repo/themes/base.css";
@import "@repo/themes/stationery.css"; /* the default theme */
@import "@repo/themes/synthwave.css"; /* other themes, if users can choose them */
```

- Theme: `data-theme="<name>"` attribute on `<html>`. Without the attribute, the default theme (`stationery`) applies.
- Dark mode: `dark` class on `<html>`, independent of the theme.
- Fonts: the theme declares the families (`--typeface-body`, `--typeface-heading`); the app loads them.
- Browser bar color: `themeBarColors[theme].light` / `.dark` (TypeScript), the `--inverse` color of each theme, for `<meta name="theme-color">`. The tests check it matches the CSS.

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

Five complete themes, light and dark, offered to the users. All use system fonts (nothing to load), so their rendering varies slightly between platforms.

| Theme | Idea | Fonts | Radius |
| --- | --- | --- | --- |
| `stationery` (default) | A paper notebook: cream paper, navy ink, terracotta stamp as the primary color, sage accent | Book serifs (Charter, Iowan Old Style) | `0.25rem` |
| `synthwave` | An 80s arcade at night: lavender by day, deep indigo with neon pink and cyan by night | Avenir, monospace headings | `0.75rem` |
| `garden` | A kitchen garden: pale sage, forest green, straw accent, terracotta for danger | Rounded (SF Pro Rounded) | `1rem` |
| `brutalist` | Raw black and white, black borders, signal-yellow band and accent, electric blue focus | Monospace, grotesque headings | none |
| `neutral` | Based on shadcn/ui's neutral theme, in pure grays; also a reference to check that `packages/ui` components don't depend on a colored theme | System fonts | `0.625rem` |

`neutral` differs from shadcn on two values to meet WCAG AA in light mode: `--muted-foreground` (`#6b6b6b` instead of `#737373`) and `--ring` (`#8a8a8a` instead of `#a1a1a1`).

## Verified contrasts

`pnpm --filter themes test` checks, for each theme and each mode, that every token is defined and that these pairs meet WCAG AA: text ≥ 4.5:1 (`background`/`foreground`, `background`/`muted-foreground`, `background`/`primary`, each surface with its `-foreground`, `inverse` with both its texts), focus ring ≥ 3:1 on `background`.

Not checked: the field border (`--input`).
