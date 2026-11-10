# @repo/ui

Shared components of the monorepo: shadcn/ui components (style `radix-nova`, on Radix UI) styled with Tailwind CSS v4. They use semantic tokens only (`bg-primary`, `text-muted-foreground`...); the colors come from [`@repo/themes`](../themes).

## Usage

In the app's main stylesheet, after the themes:

```css
@import "tailwindcss";
@import "@repo/themes/base.css";
@import "@repo/themes/brand.css";
@import "@repo/ui/styles.css";
@source "../../../packages/ui/src"; /* relative to the stylesheet, here apps/<app>/src/ */
```

Then in components:

```tsx
import { Button, cn } from "@repo/ui";

<Button variant="outline" className={cn(isActive && "font-semibold")}>Save</Button>
```

Apps import only from `@repo/ui` and `@repo/ui/styles.css`, never from internal paths.

## Contents

| Export | Description |
| --- | --- |
| `Button`, `buttonVariants` | shadcn button and its variants |
| `cn` | Merges class names and resolves Tailwind conflicts (from the `cn` package) |

## Adding a component

From this package, with the shadcn CLI:

```sh
cd packages/ui
pnpm dlx shadcn@latest add <component>
```

Then export it from `src/index.ts` and test its behavior (roles, labels, keyboard) with Testing Library.

## Scripts

`pnpm --filter ui test`, `pnpm --filter ui typecheck`.
