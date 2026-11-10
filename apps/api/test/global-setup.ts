import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { TestProject } from "vitest/node";

const MIGRATIONS_FOLDER = "drizzle";

export default async function setup(project: TestProject) {
	const url = project.config.env.DATABASE_URL;
	if (!url) {
		throw new Error("DATABASE_URL is missing from the Vitest env config.");
	}

	const client = postgres(url, { max: 1, onnotice: () => {} });
	try {
		await client`select 1`;
	} catch (error) {
		await client.end();
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Test database unreachable (${reason}). Start Docker, then run \`pnpm --filter api db:up\`.`,
		);
	}

	if (existsSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`)) {
		await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
	}
	await client.end();
}
