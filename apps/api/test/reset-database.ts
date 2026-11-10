import { sql } from "drizzle-orm";
import { beforeEach } from "vitest";
import { db } from "@/db/client";

// Empties every application table before each test; the migrations journal
// lives in the "drizzle" schema and is left untouched.
beforeEach(async () => {
	await db.execute(sql`
		DO $$
		DECLARE tables text;
		BEGIN
			SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
			INTO tables
			FROM pg_tables
			WHERE schemaname = 'public';
			IF tables IS NOT NULL THEN
				EXECUTE 'TRUNCATE ' || tables || ' RESTART IDENTITY CASCADE';
			END IF;
		END $$;
	`);
});
