import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/db/schema/columns";

// Managed by Better Auth: the fields must match what it expects (see auth.schema.test.ts).
// Stores pending sign-in links and codes.
export const verifications = pgTable(
	"verifications",
	{
		id: id(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [index().on(table.identifier)],
);
