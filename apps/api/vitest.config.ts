import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
	test: {
		env: {
			NODE_ENV: "test",
			PORT: "3001",
			// Test database created by docker/postgres/init.sql
			DATABASE_URL: "postgres://checkit:checkit@localhost:5433/checkit_test",
			CORS_ORIGINS: "http://localhost:3000",
		},
		globalSetup: ["./test/global-setup.ts"],
		// Test files share one database
		fileParallelism: false,
	},
});
