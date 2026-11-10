import { sql } from "drizzle-orm";
import type { Database } from "@/db/client";

export interface Health {
	status: "ok" | "degraded";
	database: "up" | "down";
}

export async function getHealth(db: Database): Promise<Health> {
	try {
		await db.execute(sql`select 1`);
		return { status: "ok", database: "up" };
	} catch {
		return { status: "degraded", database: "down" };
	}
}
