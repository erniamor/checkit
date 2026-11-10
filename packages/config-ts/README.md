# @repo/config-ts

Shared TypeScript configurations: the same strict options in every app and package.

| File | For | Adds to `base.json` |
| --- | --- | --- |
| `base.json` | Packages without DOM or Node (`utils`, `schemas`) | Strict mode, `noUncheckedIndexedAccess`, bundler module resolution, ES2022, no emit |
| `node.json` | Node code (`apps/api`) | ES2024, Node types (declare `@types/node` in the project) |
| `react.json` | Browser code (`apps/www`, `ui`, `themes`) | DOM libraries, JSX |

## Usage

Declare `"@repo/config-ts": "workspace:*"` in the project's `devDependencies`, then in its `tsconfig.json`:

```json
{
	"extends": "@repo/config-ts/react.json",
	"compilerOptions": {
		"paths": { "@/*": ["./src/*"] }
	},
	"include": ["src"]
}
```

Aliases (`paths`), `include` and `exclude` belong to each project, not to these files.
