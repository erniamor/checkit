import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { env } from "@/env";

export function createDatabase(url: string) {
	const client = postgres(url, { onnotice: () => {} });
	const db = drizzle(client, { schema, casing: "snake_case" });
	return { client, db };
}

export type Database = ReturnType<typeof createDatabase>["db"];

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

// postgres.js connects lazily: importing this module opens no connection
export const { client, db } = createDatabase(env.DATABASE_URL);
