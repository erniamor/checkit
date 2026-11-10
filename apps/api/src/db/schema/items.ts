import {
	boolean,
	doublePrecision,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "@/db/schema/columns";
import { lists } from "@/db/schema/lists";
import { users } from "@/db/schema/users";

export const items = pgTable(
	"items",
	{
		id: id(),
		listId: uuid()
			.notNull()
			.references(() => lists.id, { onDelete: "cascade" }),
		label: text().notNull(),
		done: boolean().notNull().default(false),
		doneAt: timestamp({ withTimezone: true }),
		// Kept as null if the user who checked the item deletes their account
		doneById: uuid().references(() => users.id, { onDelete: "set null" }),
		// Floating point, so an item can be moved between two others without renumbering
		position: doublePrecision().notNull(),
		createdById: uuid().references(() => users.id, { onDelete: "set null" }),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [index().on(table.listId, table.position)],
);
