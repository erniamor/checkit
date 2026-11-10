import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Without this option, Vitest replaces CSS imports (even with ?raw) with an empty string.
		css: true,
	},
});
