import { migrate } from "drizzle-orm/postgres-js/migrator";
import { client, db } from "@/db/client";

try {
	await migrate(db, { migrationsFolder: "drizzle" });
	console.log("Migrations applied");
} finally {
	await client.end();
}
