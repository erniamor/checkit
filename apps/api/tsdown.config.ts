import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	platform: "node",
	format: "esm",
	dts: false,
	// Internal packages are shipped as TypeScript source: compile them into the bundle
	deps: { alwaysBundle: [/^@repo\//] },
});
