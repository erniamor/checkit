/// <reference types="vitest/config" />
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
	resolve: { tsconfigPaths: true },
	plugins: [
		// Keep the options in sync with the "i18n" script of package.json
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			outputStructure: "message-modules",
			// The locale comes from the user's choice, then the browser's language
			strategy: ["cookie", "preferredLanguage", "baseLocale"],
			emitTsDeclarations: true,
		}),
		// Not needed by the tests, which render components without a server
		mode !== "test" && tanstackStart(),
		viteReact(),
		tailwindcss(),
	],
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
	},
}));
