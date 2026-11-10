import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/db/schema/columns";
import { users } from "@/db/schema/users";

// Managed by Better Auth: the fields must match what it expects (see auth.schema.test.ts).
// One row per sign-in provider linked to a user (Google, for example).
export const accounts = pgTable(
	"accounts",
	{
		id: id(),
		accountId: text().notNull(),
		providerId: text().notNull(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text(),
		refreshToken: text(),
		idToken: text(),
		accessTokenExpiresAt: timestamp({ withTimezone: true }),
		refreshTokenExpiresAt: timestamp({ withTimezone: true }),
		scope: text(),
		// Unused: password sign-in is disabled
		password: text(),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [index().on(table.userId)],
);
