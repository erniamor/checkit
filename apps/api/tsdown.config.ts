import { defineConfig } from "tsdown";

export default defineConfig({
	// The server, and the migration script run before each production deployment
	entry: ["src/index.ts", "src/db/migrate.ts"],
	platform: "node",
	format: "esm",
	dts: false,
	// Internal packages are shipped as TypeScript source: compile them into the bundle
	deps: { alwaysBundle: [/^@repo\//] },
});
