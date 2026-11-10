import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/db/schema/columns";

// Managed by Better Auth: the fields must match what it expects (see auth.schema.test.ts)
export const users = pgTable("users", {
	id: id(),
	name: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: boolean().notNull().default(false),
	image: text(),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
