import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/db/schema/columns";
import { users } from "@/db/schema/users";

// Managed by Better Auth: the fields must match what it expects (see auth.schema.test.ts)
export const sessions = pgTable(
	"sessions",
	{
		id: id(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		token: text().notNull().unique(),
		ipAddress: text(),
		userAgent: text(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [index().on(table.userId)],
);
