import { isNull } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "@/db/schema/columns";
import { memberRole } from "@/db/schema/list-members";
import { lists } from "@/db/schema/lists";
import { users } from "@/db/schema/users";

export const invitations = pgTable(
	"invitations",
	{
		id: id(),
		listId: uuid()
			.notNull()
			.references(() => lists.id, { onDelete: "cascade" }),
		// Lowercased: emails are compared case-insensitively
		email: text().notNull(),
		role: memberRole().notNull(),
		// SHA-256 of the token sent by email: the token itself is never stored
		tokenHash: text().notNull().unique(),
		invitedById: uuid().references(() => users.id, { onDelete: "set null" }),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		acceptedAt: timestamp({ withTimezone: true }),
		createdAt: createdAt(),
	},
	(table) => [
		// At most one pending invitation per list and email
		uniqueIndex().on(table.listId, table.email).where(isNull(table.acceptedAt)),
		index().on(table.listId),
	],
);
