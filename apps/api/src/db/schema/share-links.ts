import { isNull } from "drizzle-orm";
import {
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

export const shareLinks = pgTable(
	"share_links",
	{
		id: id(),
		listId: uuid()
			.notNull()
			.references(() => lists.id, { onDelete: "cascade" }),
		role: memberRole().notNull(),
		// Stored as is, unlike invitation tokens, so the owner can copy the link
		// again at any time
		token: text().notNull().unique(),
		createdById: uuid().references(() => users.id, { onDelete: "set null" }),
		revokedAt: timestamp({ withTimezone: true }),
		createdAt: createdAt(),
	},
	(table) => [
		// At most one active link per list and role
		uniqueIndex().on(table.listId, table.role).where(isNull(table.revokedAt)),
	],
);
